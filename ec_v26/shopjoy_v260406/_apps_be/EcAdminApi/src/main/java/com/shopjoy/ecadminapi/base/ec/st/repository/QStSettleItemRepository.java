package com.shopjoy.ecadminapi.base.ec.st.repository;

import com.shopjoy.ecadminapi.base.ec.st.data.dto.StSettleItemDto;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleItem;

import java.util.List;
import java.util.Optional;

/** StSettleItem QueryDSL Custom Repository */
public interface QStSettleItemRepository {

    Optional<StSettleItemDto.Item> selectById(String id);

    List<StSettleItemDto.Item> selectList(StSettleItemDto.Request search);

    StSettleItemDto.PageResponse selectPageList(StSettleItemDto.Request search);

    int updateSelective(StSettleItem entity);
}
