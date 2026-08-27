package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponProd;
import com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl.QPmCouponProdRepository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/* findCouponIdsByProdId → QPmCouponProdRepository.selectCouponIdsByProdId 로 전환 (2026-08-27) */
public interface PmCouponProdRepository extends JpaRepository<PmCouponProd, String>, QPmCouponProdRepository {

    /** 특정 쿠폰의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmCouponProd p WHERE p.couponId IN :couponIds")
    int deleteAllByCouponIds(@Param("couponIds") List<String> couponIds);
}
