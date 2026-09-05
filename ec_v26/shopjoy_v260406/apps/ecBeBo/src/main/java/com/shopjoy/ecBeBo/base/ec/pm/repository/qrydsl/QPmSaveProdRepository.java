package com.shopjoy.ecBeBo.base.ec.pm.repository.qrydsl;

import java.util.List;

/**
 * PmSaveProd QueryDSL Custom Repository.
 *
 * <p>단일컬럼 스칼라 투영(saveId 만 SELECT)과 IN 목록 기준 벌크 삭제(단일 DELETE 문)는
 * Query Method 로 표현할 수 없어 QueryDSL 사용.</p>
 */
public interface QPmSaveProdRepository {

    /** 상품에 적용 가능한 활성 적립금ID 목록 (FO 상품상세/주문 페이지용) */
    List<String> selectSaveIdsByProdId(String prodId);

    /** 특정 적립금의 전개 행 전체 삭제 (재계산 전 초기화용) */
    long deleteAllBySaveIds(List<String> saveIds);
}
