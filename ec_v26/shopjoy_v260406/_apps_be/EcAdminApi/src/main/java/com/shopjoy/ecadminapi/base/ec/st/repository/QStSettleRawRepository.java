package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleRawDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;

import java.util.List;
import java.util.Optional;

/** StSettleRaw QueryDSL Custom Repository */
public interface QStSettleRawRepository {

    Optional<StSettleRawDto.Item> selectById(String id);

    List<StSettleRawDto.Item> selectList(StSettleRawDto.Request search);

    StSettleRawDto.PageResponse selectPageList(StSettleRawDto.Request search);

    int updateSelective(StSettleRaw entity);
}
