package com.shopjoy.ecadminapi.base.ec.dp.repository.qrydsl;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;

import java.util.List;
import java.util.Optional;

public interface QDpWidgetRepository {
    Optional<DpWidgetDto.Item> selectById(String widgetId);
    List<DpWidgetDto.Item> selectList(DpWidgetDto.Request search);
    DpWidgetDto.PageResponse selectPageList(DpWidgetDto.Request search);
    int updateSelective(DpWidget entity);
}
