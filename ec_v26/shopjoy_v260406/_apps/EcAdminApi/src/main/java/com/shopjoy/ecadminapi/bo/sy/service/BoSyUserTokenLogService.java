package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhUserTokenLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhUserTokenLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 사용자 토큰 이력 서비스 — base SyhUserTokenLogService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyUserTokenLogService {

    private final SyhUserTokenLogService syhUserTokenLogService;

    /** getById — 단건조회 */
    public SyhUserTokenLogDto.Item getById(String id) {
        return syhUserTokenLogService.getById(id);
    }

    /** getList — 목록조회 */
    public List<SyhUserTokenLogDto.Item> getList(SyhUserTokenLogDto.Request req) {
        return syhUserTokenLogService.getList(req);
    }

    /** getPageData — 페이징조회 */
    public SyhUserTokenLogDto.PageResponse getPageData(SyhUserTokenLogDto.Request req) {
        return syhUserTokenLogService.getPageData(req);
    }

    /** deleteAll — 삭제 */
    @Transactional
    public void deleteAll() {
        syhUserTokenLogService.deleteAll();
    }
}
