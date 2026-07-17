package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl.QStSettleAdjRepository;

import java.util.List;

public interface StSettleAdjRepository extends JpaRepository<StSettleAdj, String>, QStSettleAdjRepository {

    /** 정산ID 기준 승인된 조정항목 목록 (aprvStatusCd='APPROVED'). */
    @Query("SELECT a FROM StSettleAdj a " +
           "WHERE a.settleId = :settleId " +
           "AND a.aprvStatusCd = 'APPROVED'")
    List<StSettleAdj> findApprovedBySettleId(@Param("settleId") String settleId);
}
