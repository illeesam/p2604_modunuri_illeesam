package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleService;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleMenuRedisStore;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleRedisStore;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * BO 역할 서비스 — base SyRoleService 위임 (thin wrapper) + 캐시 evict.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoSyRoleService {

    private final SyRoleService syRoleService;
    private final SyRoleRedisStore roleCache;
    private final SyRoleMenuRedisStore roleMenuCache;

    public SyRoleDto.Item getById(String id) { return syRoleService.getById(id); }
    public List<SyRoleDto.Item> getList(SyRoleDto.Request req) { return syRoleService.getList(req); }
    public SyRoleDto.PageResponse getPageData(SyRoleDto.Request req) { return syRoleService.getPageData(req); }

    @Transactional
    public SyRole create(SyRole body) {
        SyRole saved = syRoleService.create(body);
        roleCache.evictAll();
        return saved;
    }

    @Transactional
    public SyRole update(String id, SyRole body) {
        SyRole saved = syRoleService.update(id, body);
        roleCache.evictAll();
        return saved;
    }

    @Transactional
    public void delete(String id) {
        syRoleService.delete(id);
        roleCache.evictAll();
        roleMenuCache.evict(id);
    }

    @Transactional
    public List<SyRole> saveList(List<SyRole> rows) {
        List<SyRole> saved = syRoleService.saveList(rows);
        roleCache.evictAll();
        return saved;
    }
}
