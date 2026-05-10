package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUi;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpUiService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO DpUi 서비스 — base DpUiService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpUiService {

    private final DpUiService dpUiService;

    public DpUiDto.Item getById(String id) { return dpUiService.getById(id); }
    public List<DpUiDto.Item> getList(DpUiDto.Request req) { return dpUiService.getList(req); }
    public DpUiDto.PageResponse getPageData(DpUiDto.Request req) { return dpUiService.getPageData(req); }

    @Transactional public DpUi create(DpUi body) { return dpUiService.create(body); }
    @Transactional public DpUi update(String id, DpUi body) { return dpUiService.update(id, body); }
    @Transactional public void delete(String id) { dpUiService.delete(id); }
    @Transactional public void saveList(List<DpUi> rows) { dpUiService.saveList(rows); }
}
