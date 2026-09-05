package com.shopjoy.ecBeBo.base.ec.st.repository;

import com.shopjoy.ecBeBo.base.ec.st.data.entity.StSettleEtcAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.st.repository.qrydsl.QStSettleEtcAdjRepository;

/* findBySettleId → QStSettleEtcAdjRepository.selectList(Request.settleId) 로 통합 (2026-08-27) */
public interface StSettleEtcAdjRepository extends JpaRepository<StSettleEtcAdj, String>, QStSettleEtcAdjRepository {
}
