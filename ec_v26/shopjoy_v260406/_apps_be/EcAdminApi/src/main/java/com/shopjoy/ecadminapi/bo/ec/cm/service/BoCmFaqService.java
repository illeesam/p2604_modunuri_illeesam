package com.shopjoy.ecadminapi.bo.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmFaqDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmFaq;
import com.shopjoy.ecadminapi.base.ec.cm.service.CmFaqService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO FAQ 서비스 — base CmFaqService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoCmFaqService {

    private final CmFaqService cmFaqService;

    /* 키조회 */
    public CmFaqDto.Item getById(String id) { return cmFaqService.getById(id); }
    /* 목록조회 */
    public List<CmFaqDto.Item> getList(CmFaqDto.Request req) { return cmFaqService.getList(req); }
    /* 페이지조회 */
    public CmFaqDto.PageResponse getPageData(CmFaqDto.Request req) { return cmFaqService.getPageData(req); }

    @Transactional public CmFaq create(CmFaq body) { return cmFaqService.create(body); }
    @Transactional public CmFaq update(String id, CmFaq body) { return cmFaqService.update(id, body); }
    @Transactional public void delete(String id) { cmFaqService.delete(id); }
    @Transactional public void saveListBase(List<CmFaq> rows) { cmFaqService.saveListBase(rows); }

    /* 표시경로 노드별 카운트 */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(CmFaqDto.Request req) { return cmFaqService.getPathTreeNodeCounts(req); }
}
