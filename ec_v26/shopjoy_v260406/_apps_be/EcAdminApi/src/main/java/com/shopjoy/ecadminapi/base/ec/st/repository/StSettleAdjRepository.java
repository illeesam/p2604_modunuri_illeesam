package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleAdjRepository;

/* findApprovedBySettleId → QStSettleAdjRepository.selectApprovedBySettleId 로 전환 (2026-08-27) */
public interface StSettleAdjRepository extends JpaRepository<StSettleAdj, String>, QStSettleAdjRepository {
}
