package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivStatusHistRepository;

public interface OdhDlivStatusHistRepository extends JpaRepository<OdhDlivStatusHist, String>, QOdhDlivStatusHistRepository {
}
