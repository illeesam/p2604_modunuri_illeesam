package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponUsageRepository;

public interface PmCouponUsageRepository extends JpaRepository<PmCouponUsage, String>, QPmCouponUsageRepository {
}
