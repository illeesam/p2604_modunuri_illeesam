package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;

import java.util.List;
import java.util.Optional;

/** StSettleRaw QueryDSL Custom Repository */
public interface QStSettleRawRepository {

    Optional<StSettleRawDto.Item> selectById(String id);

    /** 정산 집계 배치용 — 관리 엔티티 그대로 반환(집계 후 settle_id 역연결 save 필요, DTO selectList 와 다른 반환타입).
     *  base 의 findBySettlePeriodAndVendor 대체 */
    List<StSettleRaw> selectListBySettlePeriodAndVendor(String settlePeriod, String vendorId);

    /** 특정 정산기간에 원천 데이터가 존재하는 업체ID 목록 (distinct).
     *  base 의 findDistinctVendorIdsBySettlePeriod 대체 (2026-08-27) */
    List<String> selectDistinctVendorIdsBySettlePeriod(String settlePeriod);

    List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search);

    BasePage<StSettleRawDto.Item> selectPageData(StSettleRawDto.Request search);

    int updateSelective(StSettleRaw entity);
}
