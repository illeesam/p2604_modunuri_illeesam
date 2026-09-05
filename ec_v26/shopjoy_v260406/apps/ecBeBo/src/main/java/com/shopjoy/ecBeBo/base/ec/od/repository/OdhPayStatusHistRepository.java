package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhPayStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhPayStatusHistRepository;

public interface OdhPayStatusHistRepository extends JpaRepository<OdhPayStatusHist, String>, QOdhPayStatusHistRepository {
}
