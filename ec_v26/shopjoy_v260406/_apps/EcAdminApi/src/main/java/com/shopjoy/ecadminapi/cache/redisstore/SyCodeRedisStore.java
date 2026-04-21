package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 시스템 공통코드 캐시.
 *
 * 저장 항목:
 *   - 그룹별 코드 목록 : code:grp:{groupCode} → List<Map>
 *   - 전체 코드 맵     : code:all             → Map<groupCode, List<Map>>
 *
 * TTL: app.redis.ttl.sy-code-seconds (기본 3600s)
 * 코드 변경 시 evict 후 재조회 or saveAll() 로 갱신.
 */
@Component
@RequiredArgsConstructor
public class SyCodeRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveGroup(String groupCode, List<Map<String, Object>> codes) {
        redis.set(CacheKey.SY_CODE_GRP + groupCode, codes, props.getTtl().getSyCodeSeconds());
    }

    public void saveAll(Map<String, List<Map<String, Object>>> allCodes) {
        redis.set(CacheKey.SY_CODE_ALL, allCodes, props.getTtl().getSyCodeSeconds());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getGroup(String groupCode) {
        return redis.get(CacheKey.SY_CODE_GRP + groupCode, List.class)
                .map(l -> (List<Map<String, Object>>) l);
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, List<Map<String, Object>>>> getAll() {
        return redis.get(CacheKey.SY_CODE_ALL, Map.class)
                .map(m -> (Map<String, List<Map<String, Object>>>) m);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictGroup(String groupCode) {
        redis.delete(CacheKey.SY_CODE_GRP + groupCode);
    }

    public void evictAll() {
        redis.deleteByPattern(CacheKey.SY_CODE_GRP + "*");
        redis.delete(CacheKey.SY_CODE_ALL);
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
