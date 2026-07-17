package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdClaimRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.repository.SySiteRepository;
import com.shopjoy.ecadminapi.co.cm.service.CmMsgSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 관리자 시스템 알림 배치 발송 Job.
 * batch_code: SY_SEND_ALARM
 * cron: 0 8 * * * (매일 08:00)
 *
 * <p><b>발송 대상 (관리자 대상 알림)</b>:
 * <ol>
 *   <li><b>미처리 주문 경보</b> — PAID 상태로 24시간 이상 방치된 주문 건수 알림</li>
 *   <li><b>미처리 클레임 경보</b> — REQUESTED 상태로 48시간 이상 방치된 클레임 건수 알림</li>
 * </ol>
 *
 * <p>알림은 {@code CmAlarmSendService} 를 통해 {@code sy_alarm} 테이블에 기록되고
 * 관리자 대시보드에서 확인 가능하다.
 *
 * <p><b>사이트 격리</b>: 활성 사이트별로 독립 처리.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SySendAlarmJob implements SchBatchJobHandler {

    /* 미처리 주문 경보 기준: 24시간 */
    private static final int UNPAID_WARN_HOURS = 24;
    /* 미처리 클레임 경보 기준: 48시간 */
    private static final int CLAIM_WARN_HOURS  = 48;

    private final SySiteRepository   siteRepository;
    private final OdOrderRepository  orderRepository;
    private final OdClaimRepository  claimRepository;
    private final CmMsgSendService   cmMsgSendService;

    @Override
    public String batchCode() {
        return "SY_SEND_ALARM";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 관리자 시스템 알림 배치 시작", batchCode());

        int totalAlarms = 0;

        for (SySite site : siteRepository.findAll()) {
            if (!"ACTIVE".equals(site.getSiteStatusCd())) continue;

            String siteId = site.getSiteId();

            /* ── 1) 미처리 주문 경보 ────────────────────────────────────── */
            LocalDateTime orderThreshold = now.minusHours(UNPAID_WARN_HOURS);
            List<OdOrder> stalePaidOrders = orderRepository
                .findStalePaidOrders(siteId, orderThreshold);

            if (!stalePaidOrders.isEmpty()) {
                String title = "미처리 주문 경보";
                String msg   = "결제 완료 후 " + UNPAID_WARN_HOURS + "시간 이상 미처리 주문이 "
                    + stalePaidOrders.size() + "건 있습니다. 즉시 확인이 필요합니다.";

                try {
                    cmMsgSendService.sendSystemAlarm(siteId, title, msg, "ORDER_WARN",
                        null, null, null, Map.of("count", stalePaidOrders.size()));
                    totalAlarms++;
                    log.info("[{}] siteId={} 미처리 주문 경보 발송 — {}건",
                        batchCode(), siteId, stalePaidOrders.size());
                } catch (Exception e) {
                    log.error("[{}] siteId={} 미처리 주문 경보 발송 실패", batchCode(), siteId, e);
                }
            }

            /* ── 2) 미처리 클레임 경보 ──────────────────────────────────── */
            LocalDateTime claimThreshold = now.minusHours(CLAIM_WARN_HOURS);
            List<OdClaim> staleClaims = claimRepository
                .findStaleRequestedClaims(siteId, claimThreshold);

            if (!staleClaims.isEmpty()) {
                String title = "미처리 클레임 경보";
                String msg   = "접수 후 " + CLAIM_WARN_HOURS + "시간 이상 미처리 클레임이 "
                    + staleClaims.size() + "건 있습니다. 즉시 확인이 필요합니다.";

                try {
                    cmMsgSendService.sendSystemAlarm(siteId, title, msg, "CLAIM_WARN",
                        null, null, null, Map.of("count", staleClaims.size()));
                    totalAlarms++;
                    log.info("[{}] siteId={} 미처리 클레임 경보 발송 — {}건",
                        batchCode(), siteId, staleClaims.size());
                } catch (Exception e) {
                    log.error("[{}] siteId={} 미처리 클레임 경보 발송 실패", batchCode(), siteId, e);
                }
            }

            /* ── 3) 추가 알림 시나리오 확장 포인트 ──────────────────────── */
            // TODO: 배치 실행 실패 요약 알림 (sy_batch.batch_run_status='FAILED' 건 집계)
            // TODO: 재고 임박 상품 알림 (pd_prod_sku.stock_qty < min_stock_qty)
        }

        log.info("[{}] 관리자 시스템 알림 배치 완료 — 총 {}건 발송", batchCode(), totalAlarms);
    }
}
