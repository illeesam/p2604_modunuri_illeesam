package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessErrorLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhAccessErrorLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * BO 오류 로그 서비스 — base SyhAccessErrorLogService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyAccessErrorLogService {

    private final SyhAccessErrorLogService syhAccessErrorLogService;

    /** getById — 단건 상세조회 */
    public SyhAccessErrorLogDto.Item getById(String id) {
        return syhAccessErrorLogService.getById(id);
    }

    /** getPageData — 페이징조회 */
    public SyhAccessErrorLogDto.PageResponse getPageData(SyhAccessErrorLogDto.Request req) {
        return syhAccessErrorLogService.getPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessErrorLogService.deleteAll();
    }
}
