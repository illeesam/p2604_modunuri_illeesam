package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhAccessLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * BO 접근 로그 서비스 — base SyhAccessLogService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyAccessLogService {

    private final SyhAccessLogService syhAccessLogService;

    /** getPageData — 페이징조회 */
    public SyhAccessLogDto.PageResponse getPageData(SyhAccessLogDto.Request req) {
        return syhAccessLogService.getPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessLogService.deleteAll();
    }
}
