package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdRefundRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OdRefundRepository extends JpaRepository<OdRefund, String>, QOdRefundRepository {

    /** 장기 PENDING 환불 — 요청일시가 threshold 이전인 건 (FAILED 자동 처리 대상) */
    @Query("SELECT r FROM OdRefund r WHERE r.refundStatusCd = 'PENDING' AND r.refundReqDate < :threshold")
    List<OdRefund> findPendingBefore(@Param("threshold") LocalDateTime threshold);

    /** 특정 claimId 들에 연결된 PENDING 환불 (클레임 완료 후 자동 COMPLT 대상) */
    @Query("SELECT r FROM OdRefund r WHERE r.claimId IN :claimIds AND r.refundStatusCd = 'PENDING' AND r.refundReqDate < :threshold")
    List<OdRefund> findPendingByClaimIdsAndBefore(@Param("claimIds") List<String> claimIds,
                                                  @Param("threshold") LocalDateTime threshold);
}
