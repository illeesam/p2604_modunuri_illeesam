package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderChgHistRepository;

public interface OdhOrderChgHistRepository extends JpaRepository<OdhOrderChgHist, String>, QOdhOrderChgHistRepository {
}
