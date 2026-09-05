package com.shopjoy.ecadminapi.bo.common.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.service.SyExceldownService;
import com.shopjoy.ecadminapi.common.excel.ExcelDownProps;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 예약(ASYNC) 엑셀 다운로드 큐 폴러.
 *
 * <p><b>왜 sy_batch 잡이 아니라 {@code @Scheduled} 인가</b><br>
 * {@code SchBatchJobRegistry.register()} 는 {@code jenkins.enabled=true}(운영)면 즉시 return 하여
 * cron 을 등록하지 않는다. 큐 폴러를 sy_batch 잡으로 만들면 운영에서 예약다운로드가 영영 실행되지
 * 않는다. {@code @EnableScheduling} 은 {@code SchBatchConfig} 에 이미 켜져 있으므로 이 빈은
 * 프로파일/Jenkins 설정과 무관하게 동작한다.</p>
 *
 * <p><b>멀티 pod 안전성</b><br>
 * 여러 pod 가 동시에 폴링해도 {@code claimNextWaiting} 이 {@code FOR UPDATE SKIP LOCKED} 로
 * 1건만 집으므로 같은 건이 중복 실행되지 않는다. 부분 유니크 인덱스(uk01_running)가 2차 방어선이다.</p>
 *
 * <p><b>pod 내 중복 실행 방지</b><br>
 * 생성은 수 분이 걸리는데 폴링 주기는 10초다. {@code busy} 플래그로 같은 pod 에서 겹쳐 도는 것을 막아
 * 2G 힙에 잡이 여러 개 쌓이지 않게 한다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BoExcelDownScheduler {

    private final SyExceldownService syExceldownService;
    private final BoExcelDownRunner runner;
    private final ExcelDownProps props;

    /** 이 pod 가 지금 엑셀을 만들고 있는지 — 폴링 겹침 방지 */
    private final AtomicBoolean busy = new AtomicBoolean(false);

    /**
     * 대기열 소비 — 10초마다 1건씩.
     *
     * <p>사이트별로 RUNNING 1건 제한이므로, 사이트 목록을 돌며 각각 1건씩 claim 을 시도한다.
     * 실제로 잡을 수 있는 건 "지금 RUNNING 이 없는 사이트" 뿐이다.</p>
     */
    @Scheduled(fixedDelayString = "${app.excel.poll-ms:10000}")
    public void pollQueue() {
        if (!busy.compareAndSet(false, true)) return;   // 이미 이 pod 에서 생성 중
        try {
            for (String siteId : targetSiteIds()) {
                /* 이미 진행중이면 이 사이트는 건너뛴다 (claim 이 uk01 로 막히지만 쿼리 낭비를 줄인다) */
                if (syExceldownService.getRunning(siteId) != null) continue;

                String id = syExceldownService.claimNextWaiting(siteId);
                if (id == null) continue;               // 대기열 없음 또는 경합에서 밀림

                log.info("[ExcelQueue] claim — siteId={}, id={}", siteId, id);
                runner.run(id);                          // 트랜잭션 밖에서 실행
                return;                                  // 한 주기엔 1건만
            }
        } catch (Exception e) {
            log.error("[ExcelQueue] 폴링 중 오류 — {}", e.getMessage(), e);
        } finally {
            busy.set(false);
        }
    }

    /**
     * 고아 회수 — heartbeat 가 끊긴 RUNNING 을 TIMEOUT 으로 되돌려 슬롯을 푼다.
     *
     * <p>pod 가 죽으면 RUNNING 이 영원히 남아 아무도 엑셀을 못 받는 상태가 된다.
     * 판정은 start_date 가 아니라 upd_date(heartbeat) 기준이라 정상 장기 실행 잡은 살아남는다.</p>
     */
    @Scheduled(fixedDelayString = "${app.excel.recover-ms:60000}")
    public void recoverStale() {
        try {
            syExceldownService.recoverStaleRunning(props.staleMinutes());
        } catch (Exception e) {
            log.error("[ExcelQueue] 고아 회수 중 오류 — {}", e.getMessage(), e);
        }
    }

    /**
     * 만료 파일 정리 — expire_date 지난 완료 건의 실제 파일과 attach 레코드를 지운다.
     *
     * <p>정리하지 않으면 20만건 xlsx 가 계속 쌓여 컨테이너 디스크를 채운다.
     * 이력 행(sy_exceldown)은 남겨 "언제 누가 무엇을 받아갔나" 는 계속 조회 가능하게 하고,
     * 파일만 지운 뒤 file_count 를 0 으로 만들어 화면이 "보관기간 만료" 로 표시하게 한다.</p>
     */
    @Scheduled(cron = "${app.excel.cleanup-cron:0 30 3 * * *}")
    public void cleanupExpired() {
        try {
            int n = runner.cleanupExpired(props.keepDays());
            if (n > 0) log.info("[ExcelQueue] 만료 엑셀파일 {}건 정리", n);
        } catch (Exception e) {
            log.error("[ExcelQueue] 만료 정리 중 오류 — {}", e.getMessage(), e);
        }
    }

    /**
     * 폴링 대상 사이트 — 대기열에 실제로 건이 있는 사이트만.
     *
     * <p>사이트 전체를 매번 도는 대신 WAITING 이 존재하는 사이트만 추린다.
     * 대기열이 비면 이 목록도 비어 폴링 비용이 사실상 0 이 된다.</p>
     */
    private Set<String> targetSiteIds() {
        SyExceldownDto.Request req = new SyExceldownDto.Request();
        req.setExceldownStatusCd("WAITING");
        req.setPageNo(1);
        req.setPageSize(200);
        req.setSort("regDate asc");
        List<SyExceldownDto.Item> waiting = syExceldownService.getList(req);

        Set<String> ids = new LinkedHashSet<>();
        for (SyExceldownDto.Item w : waiting) {
            String s = w.getRegSiteId();
            if (s != null && !s.isBlank()) ids.add(s);
        }
        return ids;
    }
}
