package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyExceldown;
import com.shopjoy.ecadminapi.base.sy.repository.SyExceldownRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 엑셀 다운로드 요청/이력 서비스 — 상태 전이와 동시성 게이트를 담당한다.
 *
 * <p><b>상태 흐름</b>
 * <pre>
 *  [예약] → WAITING ──(스케줄러 claim, SKIP LOCKED)──→ RUNNING ─┬→ DONE
 *                                                              ├→ FAIL
 *                                                              ├→ CANCELED (강제취소)
 *                                                              └→ TIMEOUT  (heartbeat 무응답, 고아 회수)
 *  [즉시] → RUNNING(요청 스레드) → DONE / FAIL
 * </pre>
 *
 * <p><b>트랜잭션 주의</b>: {@link #heartbeat}/{@link #finishDone}/{@link #finishFail} 은
 * {@link Propagation#REQUIRES_NEW} 다. 엑셀 생성은 수 분이 걸리는데 이 갱신들이 바깥 트랜잭션에
 * 묶이면 커밋 전까지 다른 pod 가 upd_date 변화를 볼 수 없어, 살아 도는 잡을 고아로 오판한다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SyExceldownService {

    private final SyExceldownRepository syExceldownRepository;

    @PersistenceContext
    private EntityManager em;

    /* ── 조회 ────────────────────────────────────────────────── */

    /** 엑셀다운로드 키조회 */
    public SyExceldownDto.Item getById(String id) {
        SyExceldownDto.Item dto = syExceldownRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null) */
    public SyExceldownDto.Item getByIdOrNull(String id) {
        return syExceldownRepository.selectById(id).orElse(null);
    }

    /** findById — 엔티티 조회 */
    public SyExceldown findById(String id) {
        return syExceldownRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** 엑셀다운로드 목록조회 */
    public List<SyExceldownDto.Item> getList(SyExceldownDto.Request req) {
        return syExceldownRepository.selectList(req);
    }

    /** 엑셀다운로드 페이지조회 */
    public BasePage<SyExceldownDto.Item> getPageData(SyExceldownDto.Request req) {
        PageHelper.addPaging(req);
        return syExceldownRepository.selectPageData(req);
    }

    /** 현재 진행중(RUNNING) 1건 — 없으면 null */
    public SyExceldownDto.Item getRunning(String siteId) {
        return syExceldownRepository.selectRunning(siteId).orElse(null);
    }

    /** 대기열(WAITING) 건수 */
    public long countWaiting(String siteId) {
        return syExceldownRepository.countWaiting(siteId);
    }

    /* ── 생성 ────────────────────────────────────────────────── */

    /**
     * 요청 등록 — SYNC 는 RUNNING, ASYNC 는 WAITING 으로 시작한다.
     *
     * <p>SYNC 는 요청 스레드가 곧바로 생성에 들어가므로 RUNNING 으로 넣는다.
     * 이때 이미 다른 RUNNING 이 있으면 부분 유니크 인덱스(uk01_running)가 INSERT 를 거부하는데,
     * 이는 "동시 1건" 정책이 DB 레벨에서 지켜지는 정상 동작이다. 호출 측이 안내 메시지로 바꿔준다.</p>
     */
    @Transactional
    public SyExceldown create(SyExceldown body) {
        body.setExceldownId(CmUtil.generateId("sy_exceldown"));
        /* regSiteId 는 EntitySaveListener 가 채워주지 않는다 — 리스너는 'siteId' 라는 이름의 필드만
           리플렉션으로 주입하고 BaseEntity.regSiteId 는 건드리지 않는다(다른 테이블은 nullable 이라
           드러나지 않았을 뿐이다). 여기서는 반드시 채워야 한다:
             1) 컬럼이 NOT NULL 이고,
             2) 동시 1건 게이트인 부분 유니크 인덱스가 reg_site_id 기준이라
                NULL 이면 유니크 판정에서 서로 다른 값으로 취급돼 게이트가 무력화된다. */
        body.setRegSiteId(SecurityUtil.getSiteIdOrDefault());
        if (body.getRunTypeCd() == null || body.getRunTypeCd().isBlank()) {
            body.setRunTypeCd("SYNC");
        }
        if (body.getExceldownStatusCd() == null || body.getExceldownStatusCd().isBlank()) {
            body.setExceldownStatusCd("SYNC".equals(body.getRunTypeCd()) ? "RUNNING" : "WAITING");
        }
        if (body.getDoneCount() == null)      body.setDoneCount(0);
        if (body.getFileCount() == null)      body.setFileCount(0);
        if (body.getDownloadCount() == null)  body.setDownloadCount(0);
        if ("RUNNING".equals(body.getExceldownStatusCd()) && body.getStartDate() == null) {
            body.setStartDate(LocalDateTime.now());
        }
        body.setPodId(podId());
        SyExceldown saved = syExceldownRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* ── 큐 / 상태 전이 ──────────────────────────────────────── */

    /**
     * 대기열에서 1건 claim (WAITING → RUNNING).
     *
     * @return claim 한 exceldownId. 대기열이 비었거나 경합에서 밀리면 null
     */
    @Transactional
    public String claimNextWaiting(String siteId) {
        return syExceldownRepository.claimNextWaiting(siteId, podId());
    }

    /**
     * heartbeat — 진행률 갱신 + upd_date 갱신.
     *
     * <p>반드시 독립 트랜잭션. 긴 생성 작업 중 주기적으로 커밋되어야
     * 다른 pod 가 "이 잡은 살아있다" 를 볼 수 있다.</p>
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void heartbeat(String exceldownId, int doneCount) {
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .doneCount(doneCount)
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /** 완료 처리 — 파일 정보와 소요시간을 기록한다. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishDone(String exceldownId, int doneCount, String fileNm, Long fileSize,
                           int fileCount, Long totalFileSize, String attachId,
                           LocalDateTime startDate, LocalDateTime expireDate) {
        LocalDateTime now = LocalDateTime.now();
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .exceldownStatusCd("DONE")
            .doneCount(doneCount)
            .fileNm(fileNm)
            .fileSize(fileSize)
            .fileCount(fileCount)
            .totalFileSize(totalFileSize)
            .attachId(attachId)
            .endDate(now)
            .elapsedMs(elapsedMs(startDate, now))
            .expireDate(expireDate)
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /** 실패 처리 */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void finishFail(String exceldownId, String errorMsg, LocalDateTime startDate) {
        LocalDateTime now = LocalDateTime.now();
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .exceldownStatusCd("FAIL")
            .errorMsg(cut(errorMsg, 2000))
            .endDate(now)
            .elapsedMs(elapsedMs(startDate, now))
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /**
     * 강제취소 — 진행중이거나 대기중인 건을 사용자가 직접 해제한다.
     *
     * <p>RUNNING 은 실행 스레드를 즉시 죽일 수 없으므로 상태만 CANCELED 로 바꾼다.
     * 실행 루프가 청크마다 상태를 확인해 스스로 중단하고, 설령 그 pod 가 이미 죽었더라도
     * 슬롯이 풀리므로 다음 요청이 진입할 수 있다.</p>
     */
    @Transactional
    public void cancel(String exceldownId) {
        CmUtil.requireId(exceldownId, "exceldownId", this);
        SyExceldownDto.Item cur = getById(exceldownId);
        if (!"RUNNING".equals(cur.getExceldownStatusCd()) && !"WAITING".equals(cur.getExceldownStatusCd())) {
            throw new CmBizException("진행중/대기중인 요청만 취소할 수 있습니다. 현재 상태: "
                + cur.getExceldownStatusCd() + "::" + CmUtil.svcCallerInfo(this));
        }
        LocalDateTime now = LocalDateTime.now();
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .exceldownStatusCd("CANCELED")
            .cancelBy(SecurityUtil.getAuthUser().authId())
            .cancelDate(now)
            .endDate(now)
            .errorMsg("사용자 강제취소")
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /** 취소 여부 확인 — 실행 루프가 청크마다 호출해 스스로 중단할지 판단 */
    public boolean isCanceled(String exceldownId) {
        SyExceldownDto.Item cur = getByIdOrNull(exceldownId);
        return cur == null || "CANCELED".equals(cur.getExceldownStatusCd());
    }

    /**
     * heartbeat 가 끊긴 RUNNING 을 TIMEOUT 으로 회수.
     *
     * @param timeoutMinutes 무응답 허용 분
     * @return 회수 건수
     */
    @Transactional
    public int recoverStaleRunning(int timeoutMinutes) {
        int n = syExceldownRepository.recoverStaleRunning(timeoutMinutes);
        if (n > 0) log.warn("[SyExceldown] 응답 없는 진행건 {}건 TIMEOUT 회수 (기준 {}분)", n, timeoutMinutes);
        return n;
    }

    /**
     * 보관기간 만료로 파일을 지운 뒤 호출 — 이력은 남기고 파일 정보만 비운다.
     * 화면은 file_count=0 을 보고 "보관기간 만료" 로 표시한다.
     */
    @Transactional
    public void markFilesPurged(String exceldownId) {
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .fileCount(0)
            .attachId("")     // updateSelective 는 null 을 건너뛰므로 빈 문자열로 비운다
            .errorMsg("보관기간 만료로 파일이 삭제되었습니다.")
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /** 다운로드 횟수 +1 */
    @Transactional
    public void increaseDownloadCount(String exceldownId) {
        SyExceldownDto.Item cur = getById(exceldownId);
        SyExceldown patch = SyExceldown.builder()
            .exceldownId(exceldownId)
            .downloadCount(CmUtil.nvlInt(cur.getDownloadCount(), 0) + 1)
            .lastDownloadDate(LocalDateTime.now())
            .build();
        syExceldownRepository.updateSelective(patch);
    }

    /** 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        if (!syExceldownRepository.existsById(id)) {
            throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        }
        syExceldownRepository.deleteById(id);
        em.flush();
    }

    /* ── 내부 ────────────────────────────────────────────────── */

    /** 실행 pod 식별자 — 컨테이너 HOSTNAME, 없으면 local */
    private String podId() {
        String h = System.getenv("HOSTNAME");
        if (h == null || h.isBlank()) h = System.getProperty("pod.id");
        return (h == null || h.isBlank()) ? "local" : cut(h, 100);
    }

    /** 컬럼 길이 초과로 INSERT 가 깨지지 않도록 잘라낸다 */
    private static String cut(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private Integer elapsedMs(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null) return null;
        long ms = java.time.Duration.between(start, end).toMillis();
        return (int) Math.min(ms, Integer.MAX_VALUE);
    }
}
