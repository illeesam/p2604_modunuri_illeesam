package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleEtcAdjDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;

import java.util.List;
import java.util.Optional;

/** StSettleEtcAdj QueryDSL Custom Repository */
public interface QStSettleEtcAdjRepository {

    Optional<StSettleEtcAdjDto.Item> selectById(String id);

    List<StSettleEtcAdjDto.Item> selectList(StSettleEtcAdjDto.Request search);

    StSettleEtcAdjDto.PageResponse selectPageList(StSettleEtcAdjDto.Request search);

    int updateSelective(StSettleEtcAdj entity);
}
