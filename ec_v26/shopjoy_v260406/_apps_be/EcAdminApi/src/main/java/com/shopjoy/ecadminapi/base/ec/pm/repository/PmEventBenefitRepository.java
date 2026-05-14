package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmEventBenefitRepository;

public interface PmEventBenefitRepository extends JpaRepository<PmEventBenefit, String>, QPmEventBenefitRepository {
}
