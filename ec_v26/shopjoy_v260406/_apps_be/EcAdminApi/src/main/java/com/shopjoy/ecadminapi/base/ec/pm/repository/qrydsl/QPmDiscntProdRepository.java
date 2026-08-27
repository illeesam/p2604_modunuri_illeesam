package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import java.util.List;

/**
 * PmDiscntProd QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 상품-할인 전개 테이블이라 baseSelColumnQuery 없이
 * discntId 컬럼만 스칼라 투영한다.</p>
 */
public interface QPmDiscntProdRepository {

    /** 상품에 적용 가능한 활성 할인ID 목록 (FO 상품상세/주문 페이지용).
     *  base 의 findDiscntIdsByProdId 대체 (2026-08-27) */
    List<String> selectDiscntIdsByProdId(String prodId);
}
