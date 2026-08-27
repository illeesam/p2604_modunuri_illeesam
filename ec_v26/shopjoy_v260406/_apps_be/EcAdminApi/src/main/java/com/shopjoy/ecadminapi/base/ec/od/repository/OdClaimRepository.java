package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimRepository;

/* findCompltCancelReturnClaims → QOdClaimRepository.selectCompltCancelReturnClaims 로 전환
   findStaleRequestedClaims → QOdClaimRepository.selectStaleRequestedClaims 로 전환 (2026-08-27) */
public interface OdClaimRepository extends JpaRepository<OdClaim, String>, QOdClaimRepository {
}
