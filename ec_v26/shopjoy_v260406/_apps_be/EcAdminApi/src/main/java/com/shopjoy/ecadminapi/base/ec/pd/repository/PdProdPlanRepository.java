package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdPlanRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/* findByProdIdOrderBySortOrdAsc → QPdProdPlanRepository.selectListByProdId 로 전환
   findActivePlans → selectActivePlans / findEndedActivePlans → selectEndedActivePlans 로 전환 (2026-08-27) */
public interface PdProdPlanRepository extends JpaRepository<PdProdPlan, String>, QPdProdPlanRepository {

    @Modifying
    @Query("DELETE FROM PdProdPlan p WHERE p.prodId = :prodId")
    void deleteByProdId(@Param("prodId") String prodId);
}
