package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdOrderItemDiscnt;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdOrderItemDiscntRepository;

public interface OdOrderItemDiscntRepository extends JpaRepository<OdOrderItemDiscnt, String>, QOdOrderItemDiscntRepository {
}
