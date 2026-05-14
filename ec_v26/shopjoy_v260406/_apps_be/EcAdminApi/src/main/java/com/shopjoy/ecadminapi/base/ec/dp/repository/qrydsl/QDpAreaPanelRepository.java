package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpAreaPanel;

import java.util.List;
import java.util.Optional;

public interface QDpAreaPanelRepository {
    Optional<DpAreaPanelDto.Item> selectById(String areaPanelId);
    List<DpAreaPanelDto.Item> selectList(DpAreaPanelDto.Request search);
    DpAreaPanelDto.PageResponse selectPageList(DpAreaPanelDto.Request search);
    int updateSelective(DpAreaPanel entity);
}
