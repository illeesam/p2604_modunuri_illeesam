package com.shopjoy.ecadminapi.base.ec.dp.repository;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;

import java.util.List;
import java.util.Optional;

public interface QDpWidgetLibRepository {
    Optional<DpWidgetLibDto.Item> selectById(String widgetLibId);
    List<DpWidgetLibDto.Item> selectList(DpWidgetLibDto.Request search);
    DpWidgetLibDto.PageResponse selectPageList(DpWidgetLibDto.Request search);
    int updateSelective(DpWidgetLib entity);
}
