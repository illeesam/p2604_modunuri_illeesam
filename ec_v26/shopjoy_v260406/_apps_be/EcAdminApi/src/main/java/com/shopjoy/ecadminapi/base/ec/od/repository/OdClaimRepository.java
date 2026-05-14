package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimRepository;

public interface OdClaimRepository extends JpaRepository<OdClaim, String>, QOdClaimRepository {
}
