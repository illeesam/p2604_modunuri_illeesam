package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleEtcAdjRepository;

import java.util.List;

public interface StSettleEtcAdjRepository extends JpaRepository<StSettleEtcAdj, String>, QStSettleEtcAdjRepository {

    /** 정산ID 기준 기타조정 항목 목록. */
    List<StSettleEtcAdj> findBySettleId(String settleId);
}
