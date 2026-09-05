package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhOrderStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhOrderStatusHistRepository;

public interface OdhOrderStatusHistRepository extends JpaRepository<OdhOrderStatusHist, String>, QOdhOrderStatusHistRepository {
}
