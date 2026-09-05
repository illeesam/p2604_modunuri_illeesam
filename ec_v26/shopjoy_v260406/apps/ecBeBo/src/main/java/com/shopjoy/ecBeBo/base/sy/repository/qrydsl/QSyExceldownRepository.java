package com.shopjoy.ecBeBo.base.sy.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyExceldownDto;
import com.shopjoy.ecBeBo.base.sy.data.entity.SyExceldown;

import java.util.List;
import java.util.Optional;

/** SyExceldown QueryDSL Custom Repository */
public interface QSyExceldownRepository {
    Optional<SyExceldownDto.Item> selectById(String exceldownId);
    List<SyExceldownDto.Item> selectList(SyExceldownDto.Request search);
    BasePage<SyExceldownDto.Item> selectPageData(SyExceldownDto.Request search);
    int updateSelective(SyExceldown entity);

    /* ── 큐/동시성 제어 ───────────────────────────────────────── */

    /** 현재 RUNNING 1건 조회 (사이트 기준). 없으면 empty */
    Optional<SyExceldownDto.Item> selectRunning(String siteId);

    /** 대기열(WAITING) 건수 */
    long countWaiting(String siteId);

    /**
     * 대기열에서 1건을 원자적으로 claim 한다 (WAITING → RUNNING).
     *
     * <p>멀티 pod 에서 여러 스케줄러가 동시에 폴링해도 같은 건을 집지 않도록
     * {@code FOR UPDATE SKIP LOCKED} 로 잠근 뒤 상태를 바꾼다.
     * 부분 유니크 인덱스(uk01_running)가 2차 방어선이므로, 경쟁에서 밀린 pod 는
     * 제약 위반으로 실패하고 다음 주기에 다시 시도한다.</p>
     *
     * @return claim 한 exceldownId. 대기열이 비었으면 null
     */
    String claimNextWaiting(String siteId, String podId);

    /**
     * heartbeat 가 끊긴 RUNNING 건을 TIMEOUT 으로 회수한다.
     *
     * <p>판정 기준은 start_date 가 아니라 upd_date(마지막 heartbeat) 이다.
     * start_date 기준으로 하면 20만건을 정상 처리 중인 잡도 죽는다.</p>
     *
     * @param timeoutMinutes 무응답 허용 분 (기본 3)
     * @return 회수된 건수
     */
    int recoverStaleRunning(int timeoutMinutes);
}
