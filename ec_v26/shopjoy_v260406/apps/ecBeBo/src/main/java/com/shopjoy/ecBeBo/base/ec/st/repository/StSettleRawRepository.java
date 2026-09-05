package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleRaw;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettleRawRepository;

import java.util.List;

/* 단일컬럼 DISTINCT 투영은 Query Method 로 표현 불가 →
   QStSettleRawRepository.selectDistinctVendorIdsBySettlePeriod() (QueryDSL) 사용 */
public interface StSettleRawRepository extends JpaRepository<StSettleRaw, String>, QStSettleRawRepository {

    /** 정산 집계 배치용 — 특정 정산기간+업체 원천 데이터 목록 */
    List<StSettleRaw> findBySettlePeriodAndVendorId(String settlePeriod, String vendorId);
}
