package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OdOrderItemRepository extends JpaRepository<OdOrderItem, String> {
}
