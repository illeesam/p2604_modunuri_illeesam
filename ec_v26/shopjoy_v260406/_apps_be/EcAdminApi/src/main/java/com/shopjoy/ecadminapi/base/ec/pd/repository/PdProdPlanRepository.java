package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface PdProdPlanRepository extends JpaRepository<PdProdPlan, String> {

    List<PdProdPlan> findByProdIdOrderBySortOrdAsc(String prodId);

    @Modifying
    @Query("DELETE FROM PdProdPlan p WHERE p.prodId = :prodId")
    void deleteByProdId(@Param("prodId") String prodId);

    /** 현재 시각 기준 ACTIVE/SCHEDULED 상태인 계획 중 지금 적용되어야 하는 것 */
    @Query("SELECT p FROM PdProdPlan p WHERE p.startDatetime <= :now AND p.endDatetime > :now AND p.planStatusCd <> 'CANCELLED'")
    List<PdProdPlan> findActivePlans(@Param("now") LocalDateTime now);

    /** 종료된 ACTIVE 계획 (endDatetime <= now) */
    @Query("SELECT p FROM PdProdPlan p WHERE p.planStatusCd = 'ACTIVE' AND p.endDatetime <= :now")
    List<PdProdPlan> findEndedActivePlans(@Param("now") LocalDateTime now);
}
