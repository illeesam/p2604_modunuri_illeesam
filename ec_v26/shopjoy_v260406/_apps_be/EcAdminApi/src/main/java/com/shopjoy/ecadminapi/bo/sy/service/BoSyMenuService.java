package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyMenuDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyMenu;
import com.shopjoy.ecadminapi.base.sy.service.SyMenuService;
import com.shopjoy.ecadminapi.cache.redisstore.SyMenuRedisStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 메뉴 서비스 — base SyMenuService 위임 (thin wrapper) + 캐시 evict.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyMenuService {

    private final SyMenuService syMenuService;
    private final SyMenuRedisStore menuCache;

    /* 키조회 */
    public SyMenuDto.Item getById(String id) { return syMenuService.getById(id); }
    /* 목록조회 */
    public List<SyMenuDto.Item> getList(SyMenuDto.Request req) { return syMenuService.getList(req); }
    /* 페이지조회 */
    public SyMenuDto.PageResponse getPageData(SyMenuDto.Request req) { return syMenuService.getPageData(req); }

    /* 등록 */
    @Transactional
    public SyMenu create(SyMenu body) {
        SyMenu saved = syMenuService.create(body);
        menuCache.evictAll();
        return saved;
    }

    /* 수정 */
    @Transactional
    public SyMenu update(String id, SyMenu body) {
        SyMenu saved = syMenuService.update(id, body);
        menuCache.evictAll();
        return saved;
    }

    /* 삭제 */
    @Transactional
    public void delete(String id) {
        syMenuService.delete(id);
        menuCache.evictAll();
    }

    /* 목록저장 */
    @Transactional
    public void saveList(List<SyMenu> rows) {
        syMenuService.saveList(rows);
        menuCache.evictAll();
    }
}
