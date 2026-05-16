package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.service.SyPathService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 표시경로 서비스 — base SyPathService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyPathService {

    private final SyPathService syPathService;

    /* 키조회 */
    public SyPathDto.Item getById(String id) { return syPathService.getById(id); }
    /* 목록조회 */
    public List<SyPathDto.Item> getList(SyPathDto.Request req) { return syPathService.getList(req); }
    /* 페이지조회 */
    public SyPathDto.PageResponse getPageData(SyPathDto.Request req) { return syPathService.getPageData(req); }

    @Transactional public SyPath create(SyPath body) { return syPathService.create(body); }
    @Transactional public SyPath update(String id, SyPath body) { return syPathService.update(id, body); }
    @Transactional public void delete(String id) { syPathService.delete(id); }
    @Transactional public void saveList(List<SyPath> rows) { syPathService.saveList(rows); }
}
