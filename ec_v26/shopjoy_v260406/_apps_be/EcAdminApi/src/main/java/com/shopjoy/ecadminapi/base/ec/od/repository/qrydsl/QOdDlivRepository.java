package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/** OdDliv QueryDSL Custom Repository */
public interface QOdDlivRepository {

    Optional<OdDlivDto.Item> selectById(String dlivId);

    List<OdDlivDto.Item> selectList(OdDlivDto.Request search);

    BasePage<OdDlivDto.Item> selectPageData(OdDlivDto.Request search);

    int updateSelective(OdDliv entity);

    /**
     * 주문 자동 완료 대상 조회 — 출고 배송(OUTBOUND) 중 DELIVERED 상태이고 배송완료일시가
     * threshold 이전인 것만 반환. 파라미터 3개 이상이라 QueryDSL 사용.
     */
    List<OdDliv> selectDeliveredOutboundBefore(String dlivDivCd, String dlivStatusCd, LocalDateTime threshold);
}
