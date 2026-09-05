package com.shopjoy.ecadminapi.base.ec.pd.repository;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl.QPdProdPlanRepository;

import java.time.LocalDateTime;
import java.util.List;

/* QueryDSL 없이 파생 쿼리로 충분 (단순 단일테이블 조회, 2026-08-27) —
   단, 파라미터 3개 이상인 조회는 QPdProdPlanRepository (QueryDSL) 사용 */
public interface PdProdPlanRepository extends JpaRepository<PdProdPlan, String>, QPdProdPlanRepository {

    List<PdProdPlan> findByProdIdOrderBySortOrdAsc(String prodId);

    void deleteByProdId(String prodId);

    /** 종료된 ACTIVE 계획 (endDatetime <= now) */
    List<PdProdPlan> findByPlanStatusCdAndEndDatetimeLessThanEqual(String planStatusCd, LocalDateTime now);
}
