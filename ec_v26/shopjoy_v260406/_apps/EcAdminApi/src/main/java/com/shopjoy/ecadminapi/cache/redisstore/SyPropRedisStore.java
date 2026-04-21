package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * 시스템 프로퍼티 캐시.
 *
 * 저장 항목:
 *   - 전체 프로퍼티 맵 : prop:all      → Map<propKey, propValue>
 *   - 단일 프로퍼티   : prop:key:{key} → String
 *
 * TTL: app.redis.ttl.sy-prop-seconds (기본 3600s)
 * 프로퍼티 변경 시 evict 후 재조회 or saveAll() 로 갱신.
 */
@Component
@RequiredArgsConstructor
public class SyPropRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveAll(Map<String, String> propMap) {
        redis.set(CacheKey.SY_PROP_ALL, propMap, props.getTtl().getSyPropSeconds());
    }

    public void save(String propKey, String propValue) {
        redis.set(CacheKey.SY_PROP_KEY + propKey, propValue, props.getTtl().getSyPropSeconds());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<Map<String, String>> getAll() {
        return redis.get(CacheKey.SY_PROP_ALL, Map.class)
                .map(m -> (Map<String, String>) m);
    }

    public Optional<String> get(String propKey) {
        return redis.get(CacheKey.SY_PROP_KEY + propKey, String.class);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evict(String propKey) {
        redis.delete(CacheKey.SY_PROP_KEY + propKey);
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.SY_PROP_KEY + "*");
        redis.delete(CacheKey.SY_PROP_ALL);
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
