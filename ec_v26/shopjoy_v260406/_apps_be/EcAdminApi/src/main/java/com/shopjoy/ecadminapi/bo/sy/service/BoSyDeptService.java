package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.base.sy.service.SyDeptService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 부서 서비스 — base SyDeptService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyDeptService {

    private final SyDeptService syDeptService;

    /* getTree */
    public List<SyDeptDto.Item> getTree() { return syDeptService.getTree(); }
    /* 키조회 */
    public SyDeptDto.Item getById(String id) { return syDeptService.getById(id); }
    /* 목록조회 */
    public List<SyDeptDto.Item> getList(SyDeptDto.Request req) { return syDeptService.getList(req); }
    /* 페이지조회 */
    public SyDeptDto.PageResponse getPageData(SyDeptDto.Request req) { return syDeptService.getPageData(req); }

    /* 등록 */
    @Transactional
    public SyDept create(SyDept body) { return syDeptService.create(body); }

    /* 수정 */
    @Transactional
    public SyDept update(String id, SyDept body) { return syDeptService.update(id, body); }

    /* 삭제 */
    @Transactional
    public void delete(String id) { syDeptService.delete(id); }

    /* 목록저장 */
    @Transactional
    public void saveList(List<SyDept> rows) { syDeptService.saveList(rows); }
}
