package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdDlivRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.OdhOrderStatusHistRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 배송완료 후 7일 경과 주문 자동 완료 처리.
 * batch_code: ORDER_AUTO_COMPLETE
 * cron: 0 2 * * * (매일 02:00)
 *
 * <p><b>처리 조건</b>:
 * <ul>
 *   <li>출고 배송(dlivDivCd=OUTBOUND) 중 dlivStatusCd=DELIVERED 인 건</li>
 *   <li>배송완료일시(dliv_date)가 현재 기준 7일 이전인 건</li>
 *   <li>연결된 주문(od_order)의 orderStatusCd 가 이미 COMPLT 이면 스킵</li>
 * </ul>
 *
 * <p><b>처리 내용</b>:
 * <ul>
 *   <li>od_order.order_status_cd = COMPLT 로 변경</li>
 *   <li>odh_order_status_hist 이력 INSERT (chg_user_id='BATCH')</li>
 * </ul>
 *
 * <p>반품/교환 입고(INBOUND) 배송은 주문 완료 산정에서 제외.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OrderAutoCompleteJob implements SchBatchJobHandler {

    private static final int COMPLETE_AFTER_DAYS = 14;

    private final OdDlivRepository           dlivRepository;
    private final OdOrderRepository          orderRepository;
    private final OdhOrderStatusHistRepository histRepository;

    @Override
    public String batchCode() {
        return "ORDER_AUTO_COMPLETE";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime threshold = now.minusDays(COMPLETE_AFTER_DAYS);
        log.info("[{}] 주문 자동 완료 처리 시작 — 기준: 배송완료일시 <= {}", batchCode(), threshold);

        List<OdDliv> targets = dlivRepository.findDeliveredOutboundBefore(threshold);

        int checked = 0, completed = 0, skipped = 0;

        for (OdDliv dliv : targets) {
            checked++;
            String orderId = dliv.getOrderId();

            OdOrder order = orderRepository.findById(orderId).orElse(null);
            if (order == null) {
                log.warn("[{}] 주문 미존재 스킵 — orderId={} dlivId={}", batchCode(), orderId, dliv.getDlivId());
                skipped++;
                continue;
            }

            // 이미 완료(COMPLT) 또는 취소(CANCEL) 상태면 스킵
            String currentStatus = order.getOrderStatusCd() != null ? order.getOrderStatusCd() : "";
            if ("COMPLT".equals(currentStatus) || "CANCEL".equals(currentStatus)) {
                skipped++;
                continue;
            }

            log.debug("[{}] 자동 완료 — orderId={} {} → COMPLT (배송완료일시: {})",
                batchCode(), orderId, currentStatus, dliv.getDlivDate());

            // 주문 상태 COMPLT 로 변경
            order.setOrderStatusCdBefore(currentStatus);
            order.setOrderStatusCd("COMPLT");
            order.setUpdBy("BATCH");
            order.setUpdDate(now);
            orderRepository.save(order);

            // 이력 INSERT
            OdhOrderStatusHist hist = new OdhOrderStatusHist();
            hist.setOrderStatusHistId(CmUtil.generateId("odh_order_status_hist"));
            hist.setSiteId(order.getSiteId());
            hist.setOrderId(orderId);
            hist.setOrderStatusCdBefore(currentStatus);
            hist.setOrderStatusCd("COMPLT");
            hist.setStatusReason("배송완료 후 " + COMPLETE_AFTER_DAYS + "일 경과 자동 완료 처리 (배송ID: " + dliv.getDlivId() + ")");
            hist.setChgUserId("BATCH");
            hist.setChgDate(now);
            hist.setRegBy("BATCH");
            hist.setRegDate(now);
            hist.setUpdBy("BATCH");
            hist.setUpdDate(now);
            histRepository.save(hist);

            completed++;
        }

        log.info("[{}] 주문 자동 완료 처리 완료 — 대상: {}건, 완료처리: {}건, 스킵: {}건",
            batchCode(), checked, completed, skipped);
    }
}
