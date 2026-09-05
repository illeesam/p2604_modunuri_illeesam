package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimStatusHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimStatusHistRepository;

public interface OdhClaimStatusHistRepository extends JpaRepository<OdhClaimStatusHist, String>, QOdhClaimStatusHistRepository {
}
