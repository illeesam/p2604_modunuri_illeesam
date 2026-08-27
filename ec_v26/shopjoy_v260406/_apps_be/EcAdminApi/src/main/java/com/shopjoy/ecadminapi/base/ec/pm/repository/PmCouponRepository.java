package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponRepository;

/* findExpireTargets → QPmCouponRepository.selectExpireTargets 로 전환
   findExpiringSoon → QPmCouponRepository.selectExpiringSoon 로 전환 (2026-08-27) */
public interface PmCouponRepository extends JpaRepository<PmCoupon, String>, QPmCouponRepository {
}
