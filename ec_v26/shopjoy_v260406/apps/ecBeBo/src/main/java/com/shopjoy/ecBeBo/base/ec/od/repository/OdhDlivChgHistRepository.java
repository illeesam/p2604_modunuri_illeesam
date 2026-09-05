package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhDlivChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhDlivChgHistRepository;

public interface OdhDlivChgHistRepository extends JpaRepository<OdhDlivChgHist, String>, QOdhDlivChgHistRepository {
}
