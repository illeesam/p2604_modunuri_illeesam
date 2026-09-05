package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;

import java.time.LocalDateTime;
import java.util.List;

/* 파라미터 3개 이상인 findByClaimIdInAndRefundStatusCdAndRefundReqDateBefore 는
   QOdRefundRepository.selectPendingByClaimIdsAndBefore (QueryDSL) 사용 */
public interface OdRefundRepository extends JpaRepository<OdRefund, String>, QOdRefundRepository {

    /** 장기 PENDING 환불 — refundStatusCd 상태이고 요청일시가 threshold 이전 */
    List<OdRefund> findByRefundStatusCdAndRefundReqDateBefore(String refundStatusCd, LocalDateTime threshold);
}
