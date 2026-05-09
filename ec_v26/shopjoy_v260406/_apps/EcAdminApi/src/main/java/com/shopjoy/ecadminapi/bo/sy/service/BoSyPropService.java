package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPropDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import com.shopjoy.ecadminapi.base.sy.service.SyPropService;
import com.shopjoy.ecadminapi.cache.redisstore.SyPropRedisStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 시스템속성 서비스 — base SyPropService 위임 (thin wrapper) + 캐시 evict.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyPropService {

    private final SyPropService syPropService;
    private final SyPropRedisStore propCache;

    public SyPropDto.Item getById(String id) { return syPropService.getById(id); }
    public List<SyPropDto.Item> getList(SyPropDto.Request req) { return syPropService.getList(req); }
    public SyPropDto.PageResponse getPageData(SyPropDto.Request req) { return syPropService.getPageData(req); }

    @Transactional
    public SyProp create(SyProp body) {
        SyProp saved = syPropService.create(body);
        propCache.evictAll();
        return saved;
    }

    @Transactional
    public SyProp update(String id, SyProp body) {
        SyProp saved = syPropService.update(id, body);
        propCache.evictAll();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        syPropService.delete(id);
        propCache.evictAll();
    }

    @Transactional
    public List<SyProp> saveList(List<SyProp> rows) {
        List<SyProp> saved = syPropService.saveList(rows);
        propCache.evictAll();
        return saved;
    }
}
