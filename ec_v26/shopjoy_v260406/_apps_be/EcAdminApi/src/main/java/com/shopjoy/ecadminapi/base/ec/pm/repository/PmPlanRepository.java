package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;

/* findSyncTargets → QPmPlanRepository.selectSyncTargets 로 전환 (2026-08-27) */
public interface PmPlanRepository extends JpaRepository<PmPlan, String>, QPmPlanRepository {
}
