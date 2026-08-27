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
 *
 * <p>PROD_STATUS_CD 실제 등록 코드(2026-08-23 4종으로 재정리): DRAFT(임시저장)/ACTIVE(전시중)/
 * INACTIVE(판매중지)/ENDED(판매종료). 예전에 있던 SCHEDULED(판매예정)/SOLDOUT(품절)은 별도 상태로
 * 두지 않고 ACTIVE(전시중) 하나로 흡수했다 — "지금 진짜 살 수 있는지"(판매예정/판매중/품절)는 상태가
 * 아니라 판매기간(sale_start_date~sale_end_date)과 재고(sold_out_yn)를 FO 조회 시점에 직접 계산해서
 * 판단한다(전시중이기만 하면 노출은 되고, 그 안에서 배지만 달라짐). 상세 → FoPdProdService.
 *
 * <p><b>배치가 관여하는 상태는 ACTIVE↔INACTIVE 둘뿐이다</b> — 판매기간을 벗어나면 ACTIVE→INACTIVE로
 * 내리고, (관리자가 종료일을 다시 미래로 늘리는 등) 판매기간 안으로 돌아오면 INACTIVE→ACTIVE로
 * 되돌린다. DRAFT(작성 중)와 ENDED(관리자가 명시적으로 완전히 끝낸 판매종료)는 배치가 절대 건드리지
 * 않는다 — DRAFT는 미완성 초안이 날짜만으로 실수 공개되는 걸 막기 위함이고, ENDED는 관리자의 최종
 * 결정이라 날짜가 바뀐다고 되살아나면 안 되기 때문이다(되살리려면 관리자가 직접 ACTIVE로 전환).
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

        List<PdProd> targets = prodRepository.findByProdStatusCdIn(List.of("ACTIVE", "INACTIVE"));
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
     * start(sale_start_date)는 NOT NULL(등록 시 자동 현재시각 채움)이라 null 분기가 없다.
     * end(sale_end_date)는 여전히 NULL=무기한 허용이라 그 분기만 남긴다.
     */
    private String resolveProdStatus(LocalDateTime now, String curStatus, LocalDateTime start, LocalDateTime end) {
        boolean withinPeriod = !now.isBefore(start) && (end == null || !now.isAfter(end));
        if ("ACTIVE".equals(curStatus)) {
            return withinPeriod ? null : "INACTIVE";
        }
        if ("INACTIVE".equals(curStatus)) {
            return withinPeriod ? "ACTIVE" : null;
        }
        return null;
    }
}
