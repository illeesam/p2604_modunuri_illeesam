package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponRepository;

/* 파라미터 3개 이상인 만료 대상 조회는 QPmCouponRepository (QueryDSL) 사용 */
public interface PmCouponRepository extends JpaRepository<PmCoupon, String>, QPmCouponRepository {
}
