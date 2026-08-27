package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdClaimDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdClaim;

import java.util.List;
import java.util.Optional;

/** OdClaim QueryDSL Custom Repository */
public interface QOdClaimRepository {

    Optional<OdClaimDto.Item> selectById(String claimId);

    List<OdClaimDto.Item> selectList(OdClaimDto.Request search);

    BasePage<OdClaimDto.Item> selectPageData(OdClaimDto.Request search);

    int updateSelective(OdClaim entity);

    /** CANCEL/RETURN 클레임 중 COMPLT 상태이고 철회되지 않은 건 (환불 자동 COMPLT 대상, 관리 엔티티 그대로 반환).
     *  base 의 findCompltCancelReturnClaims 대체 (2026-08-27) */
    List<OdClaim> selectCompltCancelReturnClaims();

    /** 미처리 클레임 경보 대상 — REQUESTED 상태로 threshold 이전 등록 (관리 엔티티 그대로 반환).
     *  base 의 findStaleRequestedClaims 대체 (2026-08-27) */
    List<OdClaim> selectStaleRequestedClaims(java.time.LocalDateTime threshold);
}
