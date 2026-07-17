package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.od.repository.OdOrderItemRepository;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdPlanRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdStockRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 상품 판매계획 가격 동기화 + 판매수량(sale_count) 갱신
 * batch_code: PROD_SALE_PLAN_SYNC
 * cron: 0 * * * * (매 시간 정각)
 *
 * <p>동작:
 * <ol>
 *   <li>ACTIVE 중 이미 종료된 계획 → ENDED 처리</li>
 *   <li>startDatetime &lt;= now &lt; endDatetime 인 SCHEDULED 계획 → ACTIVE + pd_prod 가격 반영</li>
 *   <li>od_order_item 집계 → pd_prod_stock.sale_count 전체 갱신 (취소 제외)</li>
 * </ol>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ProdSalePlanSyncJob implements SchBatchJobHandler {

    private final PdProdPlanRepository  planRepository;
    private final PdProdRepository      prodRepository;
    private final PdProdStockRepository stockRepository;
    private final OdOrderItemRepository orderItemRepository;

    @Override
    public String batchCode() {
        return "PROD_SALE_PLAN_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 판매계획 동기화 시작 — 기준시각: {}", batchCode(), now);

        // 1) 종료된 ACTIVE 계획 → ENDED
        List<PdProdPlan> ended = planRepository.findEndedActivePlans(now);
        for (PdProdPlan plan : ended) {
            plan.setPlanStatusCd("ENDED");
            plan.setUpdDate(now);
            planRepository.save(plan);
            log.debug("[{}] ENDED: planId={} prodId={}", batchCode(), plan.getPlanId(), plan.getProdId());
        }

        // 2) 지금 유효한 계획 → ACTIVE + pd_prod 가격 반영
        List<PdProdPlan> active = planRepository.findActivePlans(now);
        for (PdProdPlan plan : active) {
            // 이미 ACTIVE 이면 가격만 재확인
            if (!"ACTIVE".equals(plan.getPlanStatusCd())) {
                plan.setPlanStatusCd("ACTIVE");
                plan.setUpdDate(now);
                planRepository.save(plan);
            }

            // pd_prod 가격 반영
            prodRepository.findById(plan.getProdId()).ifPresent(prod -> {
                boolean changed = false;
                if (plan.getListPrice() != null && !plan.getListPrice().equals(prod.getListPrice())) {
                    prod.setListPrice(plan.getListPrice());
                    changed = true;
                }
                if (plan.getSalePrice() != null && !plan.getSalePrice().equals(prod.getSalePrice())) {
                    prod.setSalePrice(plan.getSalePrice());
                    changed = true;
                }
                if (plan.getPurchasePrice() != null && !plan.getPurchasePrice().equals(prod.getPurchasePrice())) {
                    prod.setPurchasePrice(plan.getPurchasePrice());
                    changed = true;
                }
                if (changed) {
                    prod.setUpdDate(now);
                    prodRepository.save(prod);
                    log.info("[{}] 가격 반영: prodId={} listPrice={} salePrice={}",
                        batchCode(), prod.getProdId(), prod.getListPrice(), prod.getSalePrice());
                }
            });
        }

        log.info("[{}] 판매계획 동기화 완료 — ENDED {}건, ACTIVE {}건", batchCode(), ended.size(), active.size());

        // 3) sale_count 갱신 — od_order_item 실집계로 pd_prod_stock 전체 업데이트
        syncSaleCount(now);
    }

    private void syncSaleCount(LocalDateTime now) {
        // prodId 기준 전체 판매수량 집계 (SKU 유무 무관, 취소 제외)
        Map<String, Long> prodQtyMap = new HashMap<>();
        for (Object[] row : orderItemRepository.sumSaleQtyByProdId()) {
            String prodId = (String) row[0];
            long   qty    = row[1] instanceof Number ? ((Number) row[1]).longValue() : 0L;
            prodQtyMap.put(prodId, qty);
        }

        // pd_prod_stock 전체 순회 — prodId 로 집계값 매핑 후 변경분만 저장
        int updated = 0;
        for (var stock : stockRepository.findAll()) {
            long newCount = stock.getProdId() != null
                ? prodQtyMap.getOrDefault(stock.getProdId(), 0L)
                : 0L;
            int newCountInt = (int) Math.min(newCount, Integer.MAX_VALUE);
            if (!Integer.valueOf(newCountInt).equals(stock.getSaleCount())) {
                stock.setSaleCount(newCountInt);
                stock.setUpdDate(now);
                stockRepository.save(stock);
                updated++;
            }
        }
        log.info("[{}] sale_count 갱신 완료 — {}건", batchCode(), updated);
    }
}
