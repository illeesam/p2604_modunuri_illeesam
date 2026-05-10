package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpPanelDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpPanel;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpPanelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO DpPanel 서비스 — base DpPanelService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpPanelService {

    private final DpPanelService dpPanelService;

    public DpPanelDto.Item getById(String id) { return dpPanelService.getById(id); }
    public List<DpPanelDto.Item> getList(DpPanelDto.Request req) { return dpPanelService.getList(req); }
    public DpPanelDto.PageResponse getPageData(DpPanelDto.Request req) { return dpPanelService.getPageData(req); }

    @Transactional public DpPanel create(DpPanel body) { return dpPanelService.create(body); }
    @Transactional public DpPanel update(String id, DpPanel body) { return dpPanelService.update(id, body); }
    @Transactional public void delete(String id) { dpPanelService.delete(id); }
    @Transactional public void saveList(List<DpPanel> rows) { dpPanelService.saveList(rows); }
}
