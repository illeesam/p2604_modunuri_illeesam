package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCoupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponRepository;

import java.time.LocalDate;
import java.util.List;

public interface PmCouponRepository extends JpaRepository<PmCoupon, String>, QPmCouponRepository {

    /**
     * 만료 처리 대상 쿠폰 조회.
     * - use_yn='Y' 이고 EXPIRED 가 아닌 상태 중 valid_to < today 인 건만 처리
     * - valid_to null = 무기한 쿠폰 → 제외
     * - 수동 비활성(use_yn='N') 쿠폰은 배치 전환 대상 제외
     */
    @Query("SELECT c FROM PmCoupon c " +
           "WHERE c.useYn = 'Y' " +
           "AND c.couponStatusCd <> 'EXPIRED' " +
           "AND c.validTo IS NOT NULL " +
           "AND c.validTo < :today")
    List<PmCoupon> findExpireTargets(@Param("today") LocalDate today);
}
