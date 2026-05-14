package com.shopjoy.ecadminapi.base.ec.st.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;

import java.util.List;
import java.util.Optional;

/** StSettle QueryDSL Custom Repository */
public interface QStSettleRepository {

    Optional<StSettleDto.Item> selectById(String id);

    List<StSettleDto.Item> selectList(StSettleDto.Request search);

    StSettleDto.PageResponse selectPageList(StSettleDto.Request search);

    int updateSelective(StSettle entity);
}
