package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;

/* findPendingBefore → QOdRefundRepository.selectPendingBefore 로 전환
   findPendingByClaimIdsAndBefore → QOdRefundRepository.selectPendingByClaimIdsAndBefore 로 전환 (2026-08-27) */
public interface OdRefundRepository extends JpaRepository<OdRefund, String>, QOdRefundRepository {
}
