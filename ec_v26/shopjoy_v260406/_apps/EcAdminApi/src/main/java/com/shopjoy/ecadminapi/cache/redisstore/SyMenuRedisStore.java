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
 * 시스템 메뉴 구조 캐시.
 *
 * 저장 항목:
 *   - 전체 메뉴 트리       : menu:all           → List<Map>
 *   - 역할별 필터드 메뉴   : menu:role:{roleId} → List<Map>
 *
 * TTL: app.redis.ttl.sy-menu-seconds (기본 3600s)
 * 메뉴 구조 변경 시 evictAll() 호출 필수.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyMenuRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveAll(List<Map<String, Object>> menuList) {
        redis.set(CacheKey.SY_MENU_ALL, menuList, props.getTtl().getSyMenuSeconds());
        log.info("[Cache][redis] [sy:menu:all] saveAll()— {}건", menuList.size());
    }

    public void saveByRole(String roleId, List<Map<String, Object>> menuList) {
        redis.set(CacheKey.SY_MENU_ROLE + roleId, menuList, props.getTtl().getSyMenuSeconds());
        log.info("[Cache][redis] [sy:menu:role][{}] saveByRole()— {}건", roleId, menuList.size());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getAll() {
        return redis.get(CacheKey.SY_MENU_ALL, List.class)
                .map(l -> (List<Map<String, Object>>) l);
    }

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getByRole(String roleId) {
        return redis.get(CacheKey.SY_MENU_ROLE + roleId, List.class)
                .map(l -> (List<Map<String, Object>>) l);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictByRole(String roleId) {
        redis.delete(CacheKey.SY_MENU_ROLE + roleId);
    }

    public void evictAll() {
        redis.delete(CacheKey.SY_MENU_ALL);
        redis.deleteByPattern(CacheKey.SY_MENU_ROLE + "*");
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
