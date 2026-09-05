package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdOrderDiscntRepository;

public interface OdOrderDiscntRepository extends JpaRepository<OdOrderDiscnt, String>, QOdOrderDiscntRepository {
}
