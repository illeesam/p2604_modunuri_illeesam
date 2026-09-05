package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdRefundDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdRefund;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** OdRefund QueryDSL Custom Repository */
public interface QOdRefundRepository {

    Optional<OdRefundDto.Item> selectById(String refundId);

    List<OdRefundDto.Item> selectList(OdRefundDto.Request search);

    BasePage<OdRefundDto.Item> selectPageData(OdRefundDto.Request search);

    int updateSelective(OdRefund entity);

    /** 특정 claimId 들에 연결된 PENDING 환불 — 파라미터 3개 이상이라 QueryDSL 사용 */
    List<OdRefund> selectPendingByClaimIdsAndBefore(List<String> claimIds, String refundStatusCd, LocalDateTime threshold);
}
