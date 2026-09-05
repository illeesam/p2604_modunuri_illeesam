package com.shopjoy.ecBeBo.base.ec.od.repository;

import com.shopjoy.ecBeBo.base.ec.od.data.entity.OdRefundMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecBeBo.base.ec.od.repository.qrydsl.QOdRefundMethodRepository;

public interface OdRefundMethodRepository extends JpaRepository<OdRefundMethod, String>, QOdRefundMethodRepository {
}
