package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemChgHistRepository;

public interface OdhOrderItemChgHistRepository extends JpaRepository<OdhOrderItemChgHist, String>, QOdhOrderItemChgHistRepository {
}
