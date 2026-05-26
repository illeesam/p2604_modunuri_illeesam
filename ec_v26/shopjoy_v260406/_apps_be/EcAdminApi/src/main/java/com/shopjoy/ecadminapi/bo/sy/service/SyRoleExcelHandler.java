package com.shopjoy.ecadminapi.bo.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyRoleDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyRole;
import com.shopjoy.ecadminapi.base.sy.repository.SyRoleRepository;
import com.shopjoy.ecadminapi.base.sy.service.SyRoleService;
import com.shopjoy.ecadminapi.cache.redisstore.SyRoleRedisStore;
import com.shopjoy.ecadminapi.common.excel.ExcelDomainHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.function.Consumer;

/** 역할 엑셀 도메인 핸들러 — domain key "role" 로 등록. upsert 후 Redis 캐시 evict. */
@Component
@RequiredArgsConstructor
public class SyRoleExcelHandler implements ExcelDomainHandler<SyRole, SyRoleDto.Item, SyRoleDto.Request> {

    private final SyRoleService syRoleService;
    private final SyRoleRepository syRoleRepository;
    private final SyRoleRedisStore roleCache;

    @Override public String key()                       { return "role"; }
    @Override public String label()                     { return "역할(권한)"; }
    @Override public Class<SyRole> entityClass()        { return SyRole.class; }
    @Override public Class<SyRoleDto.Item> itemClass()  { return SyRoleDto.Item.class; }
    @Override public Class<SyRoleDto.Request> reqClass(){ return SyRoleDto.Request.class; }
    @Override public JpaRepository<SyRole, String> repository() { return syRoleRepository; }
    @Override public long countList(SyRoleDto.Request req)      { return syRoleService.countList(req); }

    @Override
    public void fetchChunked(SyRoleDto.Request req, int chunkSize, Consumer<SyRoleDto.Item> consumer) {
        syRoleService.fetchChunked(req, chunkSize, consumer);
    }

    /** 업로드 후 역할 캐시 무효화 */
    @Override
    public void afterUpsert(Map<String, Object> result) {
        roleCache.evictAll();
    }
}
