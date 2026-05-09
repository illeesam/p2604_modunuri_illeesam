package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserLoginLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhUserLoginLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 사용자 로그인 이력 서비스 — base SyhUserLoginLogService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyUserLoginLogService {

    private final SyhUserLoginLogService syhUserLoginLogService;

    /** getById — 단건조회 */
    public SyhUserLoginLogDto.Item getById(String id) {
        return syhUserLoginLogService.getById(id);
    }

    /** getList — 목록조회 */
    public List<SyhUserLoginLogDto.Item> getList(SyhUserLoginLogDto.Request req) {
        return syhUserLoginLogService.getList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhUserLoginLogDto.PageResponse getPageData(SyhUserLoginLogDto.Request req) {
        return syhUserLoginLogService.getPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserLoginLogService.deleteAll();
    }
}
