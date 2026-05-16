package com.shopjoy.ecadminapi.bo.ec.dp.service;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpArea;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpAreaService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO DpArea 서비스 — base DpAreaService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoDpAreaService {

    private final DpAreaService dpAreaService;

    /* 키조회 */
    public DpAreaDto.Item getById(String id) { return dpAreaService.getById(id); }
    /* 목록조회 */
    public List<DpAreaDto.Item> getList(DpAreaDto.Request req) { return dpAreaService.getList(req); }
    /* 페이지조회 */
    public DpAreaDto.PageResponse getPageData(DpAreaDto.Request req) { return dpAreaService.getPageData(req); }

    @Transactional public DpArea create(DpArea body) { return dpAreaService.create(body); }
    @Transactional public DpArea update(String id, DpArea body) { return dpAreaService.update(id, body); }
    @Transactional public void delete(String id) { dpAreaService.delete(id); }
    @Transactional public void saveList(List<DpArea> rows) { dpAreaService.saveList(rows); }
}
