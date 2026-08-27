package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdOrderItemDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/** OdOrderItem QueryDSL Custom Repository */
public interface QOdOrderItemRepository {

    Optional<OdOrderItemDto.Item> selectById(String orderItemId);

    /** 상품별 판매수량 집계 — SKU 유무 무관, 취소 제외 {prodId: totalQty}.
     *  base 의 sumSaleQtyByProdId 대체 (2026-08-27) */
    Map<String, Long> selectSaleQtySumByProdId();

    List<OdOrderItemDto.Item> selectList(OdOrderItemDto.Request search);

    BasePage<OdOrderItemDto.Item> selectPageData(OdOrderItemDto.Request search);

    int updateSelective(OdOrderItem entity);
}
