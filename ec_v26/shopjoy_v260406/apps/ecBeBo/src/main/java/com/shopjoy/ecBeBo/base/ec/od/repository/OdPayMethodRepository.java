package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdPayMethodRepository;

public interface OdPayMethodRepository extends JpaRepository<OdPayMethod, String>, QOdPayMethodRepository {
}
