package com.shopjoy.ecadminapi.base.ec.od.repository;

import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl.QOdClaimRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface OdClaimRepository extends JpaRepository<OdClaim, String>, QOdClaimRepository {

    /** CANCEL/RETURN 클레임 중 COMPLT 상태이고 철회되지 않은 건 (환불 자동 COMPLT 대상 클레임 풀) */
    @Query("SELECT c FROM OdClaim c WHERE c.claimTypeCd IN ('CANCEL', 'RETURN') AND c.claimStatusCd = 'COMPLT' AND (c.claimCancelYn IS NULL OR c.claimCancelYn <> 'Y')")
    List<OdClaim> findCompltCancelReturnClaims();

    /**
     * 미처리 클레임 경보 대상 조회 — REQUESTED 상태로 threshold 이전에 등록된 클레임.
     * 접수 후 장시간 처리되지 않은 클레임을 관리자 알림으로 보고한다.
     */
    @Query("SELECT c FROM OdClaim c " +
           "WHERE c.siteId = :siteId " +
           "AND c.claimStatusCd = 'REQUESTED' " +
           "AND c.regDate < :threshold")
    List<OdClaim> findStaleRequestedClaims(@Param("siteId") String siteId,
                                            @Param("threshold") LocalDateTime threshold);
}
