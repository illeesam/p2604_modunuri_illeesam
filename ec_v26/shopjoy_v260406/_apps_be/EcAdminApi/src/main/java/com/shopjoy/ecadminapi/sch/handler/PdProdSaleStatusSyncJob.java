package com.shopjoy.ecadminapi.sch.handler;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProd;
import com.shopjoy.ecadminapi.base.ec.pd.repository.PdProdRepository;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 상품 판매기간(saleStartDate/saleEndDate) 기준 판매상태(prodStatusCd) 자동 동기화.
 * DRAFT/ACTIVE 만 대상 — STOPPED/DISCONTINUED 는 관리자 수동 처리 상태라 배치가 건드리지 않는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PdProdSaleStatusSyncJob implements SchBatchJobHandler {

    private final PdProdRepository prodRepository;

    @Override
    public String batchCode() {
        return "PROD_SALE_STATUS_SYNC";
    }

    @Override
    @Transactional
    public void execute(SyBatch batch) {
        LocalDateTime now = LocalDateTime.now();
        log.info("[{}] 상품 판매상태 동기화 시작 — 기준시각: {}", batchCode(), now);

        List<PdProd> targets = prodRepository.findSyncTargets();
        int toActive = 0, toDiscontinued = 0;
        for (PdProd prod : targets) {
            String newStatus = resolveProdStatus(now, prod.getProdStatusCd(), prod.getSaleStartDate(), prod.getSaleEndDate());
            if (newStatus == null || newStatus.equals(prod.getProdStatusCd())) continue;
            prod.setProdStatusCdBefore(prod.getProdStatusCd());
            prod.setProdStatusCd(newStatus);
            prod.setUpdBy("BATCH");
            prod.setUpdDate(now);
            prodRepository.save(prod);
            if ("ACTIVE".equals(newStatus)) toActive++;
            else if ("DISCONTINUED".equals(newStatus)) toDiscontinued++;
        }

        log.info("[{}] 완료 — {}건 검토 / ACTIVE {}건 DISCONTINUED {}건", batchCode(), targets.size(), toActive, toDiscontinued);
    }

    private String resolveProdStatus(LocalDateTime now, String curStatus, LocalDateTime start, LocalDateTime end) {
        if ("DRAFT".equals(curStatus)) {
            if (start != null && !now.isBefore(start) && (end == null || !now.isAfter(end))) return "ACTIVE";
            return null;
        }
        if ("ACTIVE".equals(curStatus)) {
            if (end != null && now.isAfter(end)) return "DISCONTINUED";
            return null;
        }
        return null;
    }
}
