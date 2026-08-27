package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderRepository;

/* findStalePaidOrders → QOdOrderRepository.selectStalePaidOrders 로 전환 (2026-08-27) */
public interface OdOrderRepository extends JpaRepository<OdOrder, String>, QOdOrderRepository {
}
