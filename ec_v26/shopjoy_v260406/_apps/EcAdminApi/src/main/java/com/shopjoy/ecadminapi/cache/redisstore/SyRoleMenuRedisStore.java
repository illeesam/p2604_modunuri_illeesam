package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

/**
 * 역할-메뉴 매핑 캐시.
 *
 * 저장 항목:
 *   - 역할별 허용 메뉴 ID 목록 : role:menu:{roleId} → List<String>
 *
 * TTL: app.redis.ttl.sy-role-menu-seconds (기본 3600s)
 * 역할 또는 메뉴 권한 변경 시 evict 필수.
 */
@Component
@RequiredArgsConstructor
public class SyRoleMenuRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void save(String roleId, List<String> menuIds) {
        redis.set(CacheKey.SY_ROLE_MENU + roleId, menuIds, props.getTtl().getSyRoleMenuSeconds());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<List<String>> get(String roleId) {
        return redis.get(CacheKey.SY_ROLE_MENU + roleId, List.class)
                .map(l -> (List<String>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evict(String roleId) {
        redis.delete(CacheKey.SY_ROLE_MENU + roleId);
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.SY_ROLE_MENU + "*");
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
