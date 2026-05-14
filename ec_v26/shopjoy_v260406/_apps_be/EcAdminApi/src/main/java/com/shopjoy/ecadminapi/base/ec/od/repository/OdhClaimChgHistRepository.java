package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimChgHistRepository;

public interface OdhClaimChgHistRepository extends JpaRepository<OdhClaimChgHist, String>, QOdhClaimChgHistRepository {
}
