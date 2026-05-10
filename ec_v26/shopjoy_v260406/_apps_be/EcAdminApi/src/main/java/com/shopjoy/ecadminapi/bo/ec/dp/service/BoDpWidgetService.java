package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidget;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpWidgetService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO DpWidget 서비스 — base DpWidgetService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpWidgetService {

    private final DpWidgetService dpWidgetService;

    public DpWidgetDto.Item getById(String id) { return dpWidgetService.getById(id); }
    public List<DpWidgetDto.Item> getList(DpWidgetDto.Request req) { return dpWidgetService.getList(req); }
    public DpWidgetDto.PageResponse getPageData(DpWidgetDto.Request req) { return dpWidgetService.getPageData(req); }

    @Transactional public DpWidget create(DpWidget body) { return dpWidgetService.create(body); }
    @Transactional public DpWidget update(String id, DpWidget body) { return dpWidgetService.update(id, body); }
    @Transactional public void delete(String id) { dpWidgetService.delete(id); }
    @Transactional public void saveList(List<DpWidget> rows) { dpWidgetService.saveList(rows); }
}
