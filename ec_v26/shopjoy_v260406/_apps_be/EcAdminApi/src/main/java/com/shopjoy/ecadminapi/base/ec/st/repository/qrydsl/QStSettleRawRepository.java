package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.common.data.BasePage;
import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;

import java.util.List;
import java.util.Optional;

/** StSettleRaw QueryDSL Custom Repository */
public interface QStSettleRawRepository {

    Optional<StSettleRawDto.Item> selectById(String id);

    List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search);

    BasePage<StSettleRawDto.Item> selectPageData(StSettleRawDto.Request search);

    int updateSelective(StSettleRaw entity);

    /** 특정 정산기간에 원천 데이터가 존재하는 업체ID 목록 (distinct) — 단일컬럼 투영이라 QueryDSL 사용 */
    List<String> selectDistinctVendorIdsBySettlePeriod(String settlePeriod);
}
