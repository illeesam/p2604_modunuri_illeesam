package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyBbmDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import com.shopjoy.ecadminapi.base.sy.service.SyBbmService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 게시판 마스터 서비스 — base SyBbmService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyBbmService {

    private final SyBbmService syBbmService;

    /* 키조회 */
    public SyBbmDto.Item getById(String id) { return syBbmService.getById(id); }
    /* 목록조회 */
    public List<SyBbmDto.Item> getList(SyBbmDto.Request req) { return syBbmService.getList(req); }
    /* 페이지조회 */
    public SyBbmDto.PageResponse getPageData(SyBbmDto.Request req) { return syBbmService.getPageData(req); }

    @Transactional public SyBbm create(SyBbm body) { return syBbmService.create(body); }
    @Transactional public SyBbm update(String id, SyBbm body) { return syBbmService.update(id, body); }
    @Transactional public void delete(String id) { syBbmService.delete(id); }
    @Transactional public void saveListBase(List<SyBbm> rows) { syBbmService.saveListBase(rows); }
    /** getPathTreeNodeCounts — 표시경로 노드별 SyBbm 수 (자손 누적) */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SyBbmDto.Request req) {
        return syBbmService.getPathTreeNodeCounts(req);
    }

}
