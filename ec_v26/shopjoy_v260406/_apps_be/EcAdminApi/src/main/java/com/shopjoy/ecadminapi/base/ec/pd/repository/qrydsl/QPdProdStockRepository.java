package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** PdProdStock QueryDSL Custom Repository */
public interface QPdProdStockRepository {

    /** UNIQUE(stock_code) 단건 조회 — base 의 findByStockCode 대체 */
    Optional<PdProdStock> selectByStockCode(String stockCode);

    /** 조건 검색 — 파라미터: prodId(단건), prodIds(목록, List&lt;String&gt;) 모두 선택.
     *  base 의 findByProdId/findByProdIdIn 두 파생메서드를 통합. */
    List<PdProdStock> selectList(Map<String, Object> p);

    /** 재고 차감 (주문 시) */
    int decreaseStock(String stockCode, int qty);

    /** 재고 복원 (취소/반품 시) */
    int increaseStock(String stockCode, int qty);

    /** 판매수량 증가 (주문 완료 시) */
    int increaseSaleCount(String stockCode, int qty);

    int updateSelective(PdProdStock entity);
}
