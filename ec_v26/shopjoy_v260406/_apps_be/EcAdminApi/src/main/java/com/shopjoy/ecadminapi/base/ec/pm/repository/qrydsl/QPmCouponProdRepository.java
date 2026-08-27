package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import java.util.List;

/**
 * PmCouponProd QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 상품-쿠폰 전개 테이블이라 baseSelColumnQuery 없이
 * couponId 컬럼만 스칼라 투영한다.</p>
 */
public interface QPmCouponProdRepository {

    /** 상품에 적용 가능한 활성 쿠폰ID 목록 (FO 상품상세/주문 페이지용).
     *  base 의 findCouponIdsByProdId 대체 (2026-08-27) */
    List<String> selectCouponIdsByProdId(String prodId);
}
