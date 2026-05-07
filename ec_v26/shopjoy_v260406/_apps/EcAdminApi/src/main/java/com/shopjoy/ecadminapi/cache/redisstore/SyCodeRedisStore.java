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
 * 시스템 공통코드 캐시.
 *
 * 저장 항목:
 *   - 그룹별 코드 목록 : code:grp:{groupCode} → List<Map>
 *   - 전체 코드 맵     : code:all             → Map<groupCode, List<Map>>
 *
 * TTL: app.redis.ttl.sy-code-seconds (기본 3600s)
 * 코드 변경 시 evict 후 재조회 or saveAll() 로 갱신.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyCodeRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    public void saveGroup(String groupCode, List<Map<String, Object>> codes) {
        redis.set(CacheKey.SY_CODE_GRP + groupCode, codes, props.getTtl().getSyCodeSeconds());
        log.info("[Cache][redis] [sy:code:grp][{}] saveGroup()— {}건", groupCode, codes.size());
    }

    /** saveAll — 저장 */
    public void saveAll(Map<String, List<Map<String, Object>>> allCodes) {
        redis.set(CacheKey.SY_CODE_ALL, allCodes, props.getTtl().getSyCodeSeconds());
        log.info("[Cache][redis] [sy:code:all] saveAll()— {}개그룹", allCodes.size());
    }

    // ── 조회 ──────────────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    public Optional<List<Map<String, Object>>> getGroup(String groupCode) {
        return redis.get(CacheKey.SY_CODE_GRP + groupCode, List.class)
                .map(l -> (List<Map<String, Object>>) l);
    }

    /** getAll — 조회 */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, List<Map<String, Object>>>> getAll() {
        return redis.get(CacheKey.SY_CODE_ALL, Map.class)
                .map(m -> (Map<String, List<Map<String, Object>>>) m);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    public void evictGroup(String groupCode) {
        redis.delete(CacheKey.SY_CODE_GRP + groupCode);
    }

    /** evictAll */
    public void evictAll() {
        redis.deleteByPattern(CacheKey.SY_CODE_GRP + "*");
        redis.delete(CacheKey.SY_CODE_ALL);
    }

    /** isEnabled — 여부 */
    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
