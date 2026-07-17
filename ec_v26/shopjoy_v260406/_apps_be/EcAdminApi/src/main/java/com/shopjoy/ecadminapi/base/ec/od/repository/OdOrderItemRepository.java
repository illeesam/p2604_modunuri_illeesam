package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemRepository;

import java.util.List;

public interface OdOrderItemRepository extends JpaRepository<OdOrderItem, String>, QOdOrderItemRepository {

    /** MD 대리주문 재저장 시 기존 항목 일괄 삭제 */
    void deleteByOrderId(String orderId);

    /**
     * 상품별 판매수량 집계 — SKU 유무 무관, 취소 제외.
     * 결과: [prodId, totalQty]
     */
    @Query("SELECT i.prodId, SUM(i.orderQty - COALESCE(i.cancelQty, 0)) " +
           "FROM OdOrderItem i " +
           "WHERE i.orderItemStatusCd <> 'CANCELLED' " +
           "GROUP BY i.prodId")
    List<Object[]> sumSaleQtyByProdId();
}
