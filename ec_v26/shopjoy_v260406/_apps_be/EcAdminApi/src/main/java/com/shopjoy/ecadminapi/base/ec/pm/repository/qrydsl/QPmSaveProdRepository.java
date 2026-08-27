package com.shopjoy.ecadminapi.base.ec.pm.repository.qrydsl;

import java.util.List;

/**
 * PmSaveProd QueryDSL Custom Repository.
 *
 * <p>DTO 투영 화면(검색/페이징)이 없는 단순 상품-적립금 전개 테이블이라 baseSelColumnQuery 없이
 * saveId 컬럼만 스칼라 투영한다.</p>
 */
public interface QPmSaveProdRepository {

    /** 상품에 적용 가능한 활성 적립금ID 목록 (FO 상품상세/주문 페이지용).
     *  base 의 findSaveIdsByProdId 대체 (2026-08-27) */
    List<String> selectSaveIdsByProdId(String prodId);
}
