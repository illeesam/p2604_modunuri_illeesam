package com.shopjoy.ecadminapi.bo.ec.pm.service;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO PmCache 서비스 — base PmCacheService 위임 (thin wrapper).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoPmCacheService {

    private final PmCacheService pmCacheService;

    public PmCacheDto.Item getById(String id) { return pmCacheService.getById(id); }
    public List<PmCacheDto.Item> getList(PmCacheDto.Request req) { return pmCacheService.getList(req); }
    public PmCacheDto.PageResponse getPageData(PmCacheDto.Request req) { return pmCacheService.getPageData(req); }

    @Transactional public PmCache create(PmCache body) { return pmCacheService.create(body); }
    @Transactional public PmCache update(String id, PmCache body) { return pmCacheService.update(id, body); }
    @Transactional public void delete(String id) { pmCacheService.delete(id); }
    @Transactional public List<PmCache> saveList(List<PmCache> rows) { return pmCacheService.saveList(rows); }
}
