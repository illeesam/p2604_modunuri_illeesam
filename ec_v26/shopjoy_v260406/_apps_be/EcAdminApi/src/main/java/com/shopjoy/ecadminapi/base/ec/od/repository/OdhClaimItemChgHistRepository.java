package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdhClaimItemChgHist;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdhClaimItemChgHistRepository;

public interface OdhClaimItemChgHistRepository extends JpaRepository<OdhClaimItemChgHist, String>, QOdhClaimItemChgHistRepository {
}
