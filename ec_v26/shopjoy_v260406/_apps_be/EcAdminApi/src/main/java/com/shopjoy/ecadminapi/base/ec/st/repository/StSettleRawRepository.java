package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleRawRepository;

/* findBySettlePeriodAndVendor → QStSettleRawRepository.selectListBySettlePeriodAndVendor 로 전환
   findDistinctVendorIdsBySettlePeriod → selectDistinctVendorIdsBySettlePeriod 로 전환 (2026-08-27) */
public interface StSettleRawRepository extends JpaRepository<StSettleRaw, String>, QStSettleRawRepository {
}
