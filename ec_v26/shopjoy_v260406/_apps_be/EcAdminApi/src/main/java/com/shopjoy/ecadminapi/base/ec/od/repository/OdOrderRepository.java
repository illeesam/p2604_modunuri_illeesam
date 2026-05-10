package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrder;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OdOrderRepository extends JpaRepository<OdOrder, String> {
}
