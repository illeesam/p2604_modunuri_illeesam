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
 * PROD_STATUS_CD 실제 등록 코드: DRAFT(임시저장)/SCHEDULED(판매예정)/ACTIVE(판매중)/SOLDOUT(품절)/INACTIVE(중지)
 * — pd.03 정책서의 STOPPED/DISCONTINUED 는 sy_code 에 등록돼 있지 않은 값이라 사용하지 않는다.
 *
 * SCHEDULED/ACTIVE 만 배치 대상 — DRAFT 는 "아직 작성 중"인 관리자 수동 상태라 배치가 절대 건드리지
 * 않는다(2026-08-23 변경: 이전엔 DRAFT 도 자동 전환 대상이었으나, 판매기간만 설정된 미완성 초안이
 * 날짜 도달만으로 실수로 공개되는 걸 막기 위해 SCHEDULED 로 분리). 관리자가 등록을 다 마치고 상태를
 * DRAFT→SCHEDULED 로 직접 바꿔야 이후 판매시작일에 배치가 ACTIVE 로 전환한다.
 * INACTIVE/SOLDOUT 은 관리자 수동/재고 기반 상태라 배치가 건드리지 않는다.
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
        int toActive = 0, toInactive = 0;
        for (PdProd prod : targets) {
            String newStatus = resolveProdStatus(now, prod.getProdStatusCd(), prod.getSaleStartDate(), prod.getSaleEndDate());
            if (newStatus == null || newStatus.equals(prod.getProdStatusCd())) continue;
            prod.setProdStatusCdBefore(prod.getProdStatusCd());
            prod.setProdStatusCd(newStatus);
            prod.setUpdBy("BATCH");
            prod.setUpdDate(now);
            prodRepository.save(prod);
            if ("ACTIVE".equals(newStatus)) toActive++;
            else if ("INACTIVE".equals(newStatus)) toInactive++;
        }

        log.info("[{}] 완료 — {}건 검토 / ACTIVE {}건 INACTIVE {}건", batchCode(), targets.size(), toActive, toInactive);
    }

    /**
     * start(sale_start_date)는 2026-08-23부터 NOT NULL(등록 시 자동 현재시각 채움)이라 null 분기가 없다.
     * end(sale_end_date)는 여전히 NULL=무기한 허용이라 그 분기만 남긴다.
     */
    private String resolveProdStatus(LocalDateTime now, String curStatus, LocalDateTime start, LocalDateTime end) {
        if ("SCHEDULED".equals(curStatus)) {
            if (!now.isBefore(start) && (end == null || !now.isAfter(end))) return "ACTIVE";
            return null;
        }
        if ("ACTIVE".equals(curStatus)) {
            if (end != null && now.isAfter(end)) return "INACTIVE";
            return null;
        }
        return null;
    }
}
