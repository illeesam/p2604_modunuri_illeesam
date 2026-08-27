package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdDlivRepository;

/* findStatusAndShipDateBefore — 호출부 0건 확인 후 제거
   findDlivStatusCd → QOdDlivRepository.selectListByDlivStatusCd 로 전환
   findDeliveredOutboundBefore → QOdDlivRepository.selectDeliveredOutboundBefore 로 전환 (2026-08-27) */
public interface OdDlivRepository extends JpaRepository<OdDliv, String>, QOdDlivRepository {
}
