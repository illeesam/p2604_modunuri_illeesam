package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmEventRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.PmPlanRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 이벤트 / 기획전 시작·종료일 기준 상태 자동 동기화.
 * batch_code: EVENT_STATUS_SYNC
 * cron: 0 0 * * * (매일 00:00)
 *
 * <p><b>이벤트(pm_event) 전환 규칙</b> — EVENT_STATUS 코드:
 * <ul>
 *   <li>today &lt; start_date              → PENDING (시작 전)</li>
 *   <li>start_date &le; today &le; end_date → ACTIVE  (진행중)</li>
 *   <li>today &gt; end_date                → ENDED   (종료)</li>
 * </ul>
 *
 * <p><b>기획전(pm_plan) 전환 규칙</b> — PLAN_STATUS 코드:
 * <ul>
 *   <li>today &lt; start_date              → DRAFT   (시작 전)</li>
 *   <li>start_date &le; today &le; end_date → ACTIVE  (진행중)</li>
 *   <li>today &gt; end_date                → ENDED   (종료)</li>
 * </ul>
 *
 * <p><b>공통 필터 정책</b>:
 * <ul>
 *   <li>use_yn = 'Y' 인 건만 처리 — 수동 비활성 건은 배치가 건드리지 않음</li>
 *   <li>이미 ENDED 인 건은 조회 제외 — 날짜 역행 없으면 재전환 불필요</li>
 *   <li>start_date / end_date 중 하나라도 null 이면 스킵</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PmEventStatusSyncJob implements SchBatchJobHandler {

    private final PmEventRepository eventRepository;
    private final PmPlanRepository  planRepository;

    @Override
    public String batchCode() {
        return "EVENT_STATUS_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDate     today = LocalDate.now();
        LocalDateTime now   = LocalDateTime.now();
        log.info("[{}] 이벤트/기획전 상태 동기화 시작 — 기준일: {}", batchCode(), today);

        int[] eventResult = syncEvents(today, now);
        int[] planResult  = syncPlans(today, now);

        log.info("[{}] 완료 — 이벤트: {}건 검토 / ACTIVE {}건 ENDED {}건 PENDING {}건 | " +
                 "기획전: {}건 검토 / ACTIVE {}건 ENDED {}건 DRAFT {}건",
            batchCode(),
            eventResult[0], eventResult[1], eventResult[2], eventResult[3],
            planResult[0],  planResult[1],  planResult[2],  planResult[3]);
    }

    // ── 이벤트 동기화 ─────────────────────────────────────────────────────

    /** @return [total, toActive, toEnded, toPending] */
    private int[] syncEvents(LocalDate today, LocalDateTime now) {
        var targets = eventRepository.findSyncTargets();
        int toActive = 0, toEnded = 0, toPending = 0;

        for (PmEvent event : targets) {
            String newStatus = resolveEventStatus(today, event.getStartDate(), event.getEndDate());
            if (newStatus == null || newStatus.equals(event.getEventStatusCd())) continue;

            log.debug("[{}] 이벤트 {} → {} — eventId={} eventNm={}",
                batchCode(), event.getEventStatusCd(), newStatus,
                event.getEventId(), event.getEventNm());

            event.setEventStatusCdBefore(event.getEventStatusCd());
            event.setEventStatusCd(newStatus);
            event.setUpdBy("BATCH");
            event.setUpdDate(now);
            eventRepository.save(event);

            switch (newStatus) {
                case "ACTIVE"  -> toActive++;
                case "ENDED"   -> toEnded++;
                case "PENDING" -> toPending++;
            }
        }
        return new int[]{targets.size(), toActive, toEnded, toPending};
    }

    // ── 기획전 동기화 ─────────────────────────────────────────────────────

    /** @return [total, toActive, toEnded, toDraft] */
    private int[] syncPlans(LocalDate today, LocalDateTime now) {
        var targets = planRepository.findSyncTargets();
        int toActive = 0, toEnded = 0, toDraft = 0;

        for (PmPlan plan : targets) {
            String newStatus = resolvePlanStatus(today, plan.getStartDate(), plan.getEndDate());
            if (newStatus == null || newStatus.equals(plan.getPlanStatusCd())) continue;

            log.debug("[{}] 기획전 {} → {} — planId={} planNm={}",
                batchCode(), plan.getPlanStatusCd(), newStatus,
                plan.getPlanId(), plan.getPlanNm());

            plan.setPlanStatusCdBefore(plan.getPlanStatusCd());
            plan.setPlanStatusCd(newStatus);
            plan.setUpdBy("BATCH");
            plan.setUpdDate(now);
            planRepository.save(plan);

            switch (newStatus) {
                case "ACTIVE" -> toActive++;
                case "ENDED"  -> toEnded++;
                case "DRAFT"  -> toDraft++;
            }
        }
        return new int[]{targets.size(), toActive, toEnded, toDraft};
    }

    // ── 상태 계산 ─────────────────────────────────────────────────────────

    /** 이벤트: PENDING / ACTIVE / ENDED */
    private String resolveEventStatus(LocalDate today, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return null;
        if (today.isBefore(startDate)) return "PENDING";
        if (today.isAfter(endDate))    return "ENDED";
        return "ACTIVE";
    }

    /** 기획전: DRAFT / ACTIVE / ENDED */
    private String resolvePlanStatus(LocalDate today, LocalDate startDate, LocalDate endDate) {
        if (startDate == null || endDate == null) return null;
        if (today.isBefore(startDate)) return "DRAFT";
        if (today.isAfter(endDate))    return "ENDED";
        return "ACTIVE";
    }
}
