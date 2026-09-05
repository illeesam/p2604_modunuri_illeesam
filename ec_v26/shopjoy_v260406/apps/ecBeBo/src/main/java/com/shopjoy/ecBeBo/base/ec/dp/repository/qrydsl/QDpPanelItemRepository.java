package com.shopjoy.ecBeBo.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.ec.dp.data.dto.DpPanelItemDto;
import com.shopjoy.ecBeBo.base.ec.dp.data.entity.DpPanelItem;

import java.util.List;
import java.util.Optional;

public interface QDpPanelItemRepository {
    Optional<DpPanelItemDto.Item> selectById(String panelItemId);
    List<DpPanelItemDto.Item> selectList(DpPanelItemDto.Request search);
    BasePage<DpPanelItemDto.Item> selectPageData(DpPanelItemDto.Request search);
    int updateSelective(DpPanelItem entity);
}
