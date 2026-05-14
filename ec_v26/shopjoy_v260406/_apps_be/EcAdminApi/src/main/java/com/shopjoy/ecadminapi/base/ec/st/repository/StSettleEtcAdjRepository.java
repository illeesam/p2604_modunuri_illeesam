package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleEtcAdjRepository;

public interface StSettleEtcAdjRepository extends JpaRepository<StSettleEtcAdj, String>, QStSettleEtcAdjRepository {
}
