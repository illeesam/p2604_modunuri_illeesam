package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderItemStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderItemStatusHistRepository;

public interface OdhOrderItemStatusHistRepository extends JpaRepository<OdhOrderItemStatusHist, String>, QOdhOrderItemStatusHistRepository {
}
