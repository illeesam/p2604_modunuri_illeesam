package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;

import java.util.List;
import java.util.Optional;

/** OdRefund QueryDSL Custom Repository */
public interface QOdRefundRepository {

    Optional<OdRefundDto.Item> selectById(String refundId);

    List<OdRefundDto.Item> selectList(OdRefundDto.Request search);

    BasePage<OdRefundDto.Item> selectPageData(OdRefundDto.Request search);

    int updateSelective(OdRefund entity);

    /** 장기 PENDING 환불 — 요청일시가 threshold 이전 (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findPendingBefore 대체 (2026-08-27) */
    List<OdRefund> selectPendingBefore(java.time.LocalDateTime threshold);

    /** 특정 claimId 들에 연결된 PENDING 환불 (mutate+save 필요, 관리 엔티티 그대로 반환).
     *  base 의 findPendingByClaimIdsAndBefore 대체 (2026-08-27) */
    List<OdRefund> selectPendingByClaimIdsAndBefore(List<String> claimIds, java.time.LocalDateTime threshold);
}
