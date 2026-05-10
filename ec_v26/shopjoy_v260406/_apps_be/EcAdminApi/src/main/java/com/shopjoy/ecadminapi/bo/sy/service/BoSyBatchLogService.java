package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhBatchLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 배치 로그 서비스 — base SyhBatchLogService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyBatchLogService {

    private final SyhBatchLogService syhBatchLogService;

    /** getById — 단건조회 */
    public SyhBatchLogDto.Item getById(String id) {
        return syhBatchLogService.getById(id);
    }

    /** getList — 목록조회 */
    public List<SyhBatchLogDto.Item> getList(SyhBatchLogDto.Request req) {
        return syhBatchLogService.getList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhBatchLogDto.PageResponse getPageData(SyhBatchLogDto.Request req) {
        return syhBatchLogService.getPageData(req);
    }
}
