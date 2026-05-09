package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyCodeDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyCode;
import com.shopjoy.ecadminapi.base.sy.service.SyCodeService;
import com.shopjoy.ecadminapi.cache.redisstore.SyCodeRedisStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 공통코드 서비스 — base SyCodeService 위임 (thin wrapper) + 캐시 evict.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyCodeService {

    private final SyCodeService syCodeService;
    private final SyCodeRedisStore codeCache;

    public SyCodeDto.Item getById(String id) { return syCodeService.getById(id); }
    public List<SyCodeDto.Item> getList(SyCodeDto.Request req) { return syCodeService.getList(req); }
    public SyCodeDto.PageResponse getPageData(SyCodeDto.Request req) { return syCodeService.getPageData(req); }

    @Transactional
    public SyCode create(SyCode body) {
        SyCode saved = syCodeService.create(body);
        codeCache.evictAll();
        return saved;
    }

    @Transactional
    public SyCode update(String id, SyCode body) {
        SyCode saved = syCodeService.update(id, body);
        codeCache.evictAll();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        syCodeService.delete(id);
        codeCache.evictAll();
    }

    @Transactional
    public List<SyCode> saveList(List<SyCode> rows) {
        List<SyCode> saved = syCodeService.saveList(rows);
        codeCache.evictAll();
        return saved;
    }
}
