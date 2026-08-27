package com.shopjoy.ecadminapi.base.ec.pd.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdStock;

import java.util.Optional;

/** PdProdStock QueryDSL Custom Repository */
public interface QPdProdStockRepository {

    Optional<PdProdStock> selectByStockCode(String stockCode);

    /** 재고 차감 (주문 시) */
    int decreaseStock(String stockCode, int qty);

    /** 재고 복원 (취소/반품 시) */
    int increaseStock(String stockCode, int qty);

    /** 판매수량 증가 (주문 완료 시) */
    int increaseSaleCount(String stockCode, int qty);

    int updateSelective(PdProdStock entity);
}
