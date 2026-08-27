package com.shopjoy.ecadminapi.base.ec.od.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.od.data.dto.OdDlivDto;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdDliv;

import java.util.List;
import java.util.Optional;

/** OdDliv QueryDSL Custom Repository */
public interface QOdDlivRepository {

    Optional<OdDlivDto.Item> selectById(String dlivId);

    /** 배송상태 동기화 배치용 — 관리 엔티티 그대로 반환(상태변경 후 save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findByDlivStatusCd 대체 */
    List<OdDliv> selectListByDlivStatusCd(String dlivStatusCd);

    List<OdDlivDto.Item> selectList(OdDlivDto.Request search);

    BasePage<OdDlivDto.Item> selectPageData(OdDlivDto.Request search);

    int updateSelective(OdDliv entity);

    /** 주문 자동완료 대상 — 출고(OUTBOUND) DELIVERED 이고 배송완료일시가 threshold 이전(관리 엔티티 그대로 반환).
     *  base 의 findDeliveredOutboundBefore 대체 (2026-08-27) */
    List<OdDliv> selectDeliveredOutboundBefore(java.time.LocalDateTime threshold);
}
