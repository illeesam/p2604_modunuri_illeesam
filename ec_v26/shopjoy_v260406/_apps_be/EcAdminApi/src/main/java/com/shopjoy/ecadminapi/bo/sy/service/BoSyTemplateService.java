package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyTemplateDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyTemplate;
import com.shopjoy.ecadminapi.base.sy.service.SyTemplateService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 템플릿 서비스 — base SyTemplateService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyTemplateService {

    private final SyTemplateService syTemplateService;

    /* 키조회 */
    public SyTemplateDto.Item getById(String id) { return syTemplateService.getById(id); }
    /* 목록조회 */
    public List<SyTemplateDto.Item> getList(SyTemplateDto.Request req) { return syTemplateService.getList(req); }
    /* 페이지조회 */
    public SyTemplateDto.PageResponse getPageData(SyTemplateDto.Request req) { return syTemplateService.getPageData(req); }

    @Transactional public SyTemplate create(SyTemplate body) { return syTemplateService.create(body); }
    @Transactional public SyTemplate update(String id, SyTemplate body) { return syTemplateService.update(id, body); }
    @Transactional public void delete(String id) { syTemplateService.delete(id); }
    @Transactional public void saveList(String cmd, List<SyTemplate> rows) { syTemplateService.saveList(cmd, rows); }
    /** getPathCounts — 표시경로 노드별 SyTemplate 수 (자손 누적) */
    public java.util.Map<String, Long> getPathCounts() {
        return syTemplateService.getPathCounts();
    }

}
