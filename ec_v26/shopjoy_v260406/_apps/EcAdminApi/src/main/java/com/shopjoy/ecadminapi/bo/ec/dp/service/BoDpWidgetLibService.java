package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpWidgetLibDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpWidgetLib;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpWidgetLibService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO DpWidgetLib 서비스 — base DpWidgetLibService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpWidgetLibService {

    private final DpWidgetLibService dpWidgetLibService;

    public DpWidgetLibDto.Item getById(String id) { return dpWidgetLibService.getById(id); }
    public List<DpWidgetLibDto.Item> getList(DpWidgetLibDto.Request req) { return dpWidgetLibService.getList(req); }
    public DpWidgetLibDto.PageResponse getPageData(DpWidgetLibDto.Request req) { return dpWidgetLibService.getPageData(req); }

    @Transactional public DpWidgetLib create(DpWidgetLib body) { return dpWidgetLibService.create(body); }
    @Transactional public DpWidgetLib update(String id, DpWidgetLib body) { return dpWidgetLibService.update(id, body); }
    @Transactional public void delete(String id) { dpWidgetLibService.delete(id); }
    @Transactional public void saveList(List<DpWidgetLib> rows) { dpWidgetLibService.saveList(rows); }
}
