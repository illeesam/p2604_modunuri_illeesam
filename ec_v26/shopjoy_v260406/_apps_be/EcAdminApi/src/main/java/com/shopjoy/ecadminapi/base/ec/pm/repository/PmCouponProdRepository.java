package com.shopjoy.ecadminapi.base.ec.pm.repository;

import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponProd;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PmCouponProdRepository extends JpaRepository<PmCouponProd, PmCouponProd.PK> {

    /** 특정 쿠폰의 전개 행 전체 삭제 (재계산 전 초기화용) */
    @Modifying
    @Query("DELETE FROM PmCouponProd p WHERE p.couponId IN :couponIds")
    int deleteAllByCouponIds(@Param("couponIds") List<String> couponIds);

    /** 상품에 적용 가능한 활성 쿠폰 목록 조회 (FO 상품상세/주문 페이지용) */
    @Query("SELECT p.couponId FROM PmCouponProd p WHERE p.prodId = :prodId AND p.siteId = :siteId")
    List<String> findCouponIdsByProdId(@Param("prodId") String prodId, @Param("siteId") String siteId);
}
