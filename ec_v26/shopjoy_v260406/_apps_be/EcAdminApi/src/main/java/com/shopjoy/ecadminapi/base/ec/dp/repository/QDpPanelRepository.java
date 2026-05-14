package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;

import java.util.List;
import java.util.Optional;

public interface QDpPanelRepository {
    Optional<DpPanelDto.Item> selectById(String panelId);
    List<DpPanelDto.Item> selectList(DpPanelDto.Request search);
    DpPanelDto.PageResponse selectPageList(DpPanelDto.Request search);
    int updateSelective(DpPanel entity);
}
