package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 역할(Role) 정보 캐시.
 *
 * 저장 항목:
 *   - 전체 역할 목록 : role:all          → List<Map>
 *   - 역할 상세      : role:dtl:{roleId} → Map<String, Object>
 *
 * TTL: app.redis.ttl.sy-role-seconds (기본 3600s)
 * 역할 변경 시 evict 후 재조회.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyRoleRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveAll(List<Map<String, Object>> roles) {
        redis.set(CacheKey.SY_ROLE_ALL, roles, props.getTtl().getSyRoleSeconds());
        log.info("[Cache][redis] [sy:role:all] saveAll()— {}건", roles.size());
    }

    public void save(String roleId, Map<String, Object> role) {
        redis.set(CacheKey.SY_ROLE_DTL + roleId, role, props.getTtl().getSyRoleSeconds());
        log.info("[Cache][redis] [sy:role:dtl][{}] save()", roleId);
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getAll() {
        return redis.get(CacheKey.SY_ROLE_ALL, List.class)
                .map(l -> (List<Map<String, Object>>) l);
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> get(String roleId) {
        return redis.get(CacheKey.SY_ROLE_DTL + roleId, Map.class)
                .map(m -> (Map<String, Object>) m);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evict(String roleId) {
        redis.delete(CacheKey.SY_ROLE_DTL + roleId);
    }

    public void evictAll() {
        redis.delete(CacheKey.SY_ROLE_ALL);
        redis.deleteByPattern(CacheKey.SY_ROLE_DTL + "*");
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
