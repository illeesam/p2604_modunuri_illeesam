package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderItemDiscntRepository;

public interface OdOrderItemDiscntRepository extends JpaRepository<OdOrderItemDiscnt, String>, QOdOrderItemDiscntRepository {
}
