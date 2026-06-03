package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SySiteDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import com.shopjoy.ecadminapi.base.sy.service.SySiteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 사이트 서비스 — base SySiteService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSySiteService {

    private final SySiteService sySiteService;

    /** getById — 단건조회 */
    public SySiteDto.Item getById(String id) {
        return sySiteService.getById(id);
    }

    /** getList — 목록조회 */
    public List<SySiteDto.Item> getList(SySiteDto.Request req) {
        return sySiteService.getList(req);
    }

    /** getPageData — 페이징조회 */
    public SySiteDto.PageResponse getPageData(SySiteDto.Request req) {
        return sySiteService.getPageData(req);
    }

    /** getPathTreeNodeCounts — 표시경로 노드별 사이트수 (검색조건 + 자손 누적) */
    public java.util.List<java.util.Map<String, Object>> getPathTreeNodeCounts(SySiteDto.Request req) {
        return sySiteService.getPathTreeNodeCounts(req);
    }

    /** create — 생성 */
    @Transactional
    public SySite create(SySite body) {
        return sySiteService.create(body);
    }

    /** update — 수정 */
    @Transactional
    public SySite update(String id, SySite body) {
        return sySiteService.update(id, body);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        sySiteService.delete(id);
    }

    /** saveList — 일괄 저장 */
    @Transactional
    public void saveListBase(List<SySite> rows) {
        sySiteService.saveListBase(rows);
    }
}
