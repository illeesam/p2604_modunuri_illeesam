package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanelItem;

import java.util.List;
import java.util.Optional;

public interface QDpPanelItemRepository {
    Optional<DpPanelItemDto.Item> selectById(String panelItemId);
    List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search);
    DpPanelItemDto.PageResponse selectPageList(DpPanelItemDto.Request search);
    int updateSelective(DpPanelItem entity);
}
