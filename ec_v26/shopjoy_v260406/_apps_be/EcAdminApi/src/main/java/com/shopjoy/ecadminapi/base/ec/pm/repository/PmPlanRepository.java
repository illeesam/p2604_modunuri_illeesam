package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmPlanRepository;

public interface PmPlanRepository extends JpaRepository<PmPlan, String>, QPmPlanRepository {
}
