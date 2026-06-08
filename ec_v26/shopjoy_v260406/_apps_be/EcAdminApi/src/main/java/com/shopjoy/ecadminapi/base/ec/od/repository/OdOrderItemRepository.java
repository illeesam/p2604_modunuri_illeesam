package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemRepository;

public interface OdOrderItemRepository extends JpaRepository<OdOrderItem, String>, QOdOrderItemRepository {
    /** MD 대리주문 재저장 시 기존 항목 일괄 삭제 */
    void deleteByOrderId(String orderId);
}
