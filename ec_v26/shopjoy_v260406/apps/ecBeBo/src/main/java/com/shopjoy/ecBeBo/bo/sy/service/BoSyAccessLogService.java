package com.shopjoy.ecBeBo.bo.sy.service;

import com.shopjoy.ecBeBo.common.data.BasePage;
import com.shopjoy.ecBeBo.base.sy.data.dto.SyhAccessLogDto;
import com.shopjoy.ecBeBo.base.sy.service.SyhAccessLogService;
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

    /** getById — 단건 상세조회 */
    public SyhAccessLogDto.Item getById(String id) {
        return syhAccessLogService.getById(id);
    }

    /** getPageData — 페이징조회 */
    public BasePage<SyhAccessLogDto.Item> getPageData(SyhAccessLogDto.Request req) {
        return syhAccessLogService.getPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhAccessLogService.deleteAll();
    }
}
