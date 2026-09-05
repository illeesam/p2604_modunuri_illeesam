package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * 다국어(i18n) 메시지 캐시.
 *
 * 저장 항목:
 *   - 전체 다국어 맵  : i18n:all                 → Map<locale, Map<msgKey, msgValue>>
 *   - 단일 메시지     : i18n:msg:{locale}:{key}   → String
 *
 * TTL: app.redis.ttl.sy-i18n-seconds (기본 3600s)
 * 메시지 변경 시 evictAll() 호출 필수.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SyI18nRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 저장 ──────────────────────────────────────────────────────

    /* saveAll */
    public void saveAll(Map<String, Map<String, String>> i18nMap) {
        redis.set(CacheKey.SY_I18N_ALL, i18nMap, props.getTtl().getSyI18nSeconds());
        log.info("[Cache][redis] [sy:i18n:all] saveAll()— {}개언어", i18nMap.size());
    }

    /** save — 저장 */
    public void save(String locale, String msgKey, String msgValue) {
        redis.set(CacheKey.SY_I18N_MSG + locale + ":" + msgKey, msgValue, props.getTtl().getSyI18nSeconds());
        log.info("[Cache][redis] [sy:i18n:msg][{}:{}] save()", locale, msgKey);
    }

    // ── 조회 ──────────────────────────────────────────────────────

    /* getAll */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Map<String, String>>> getAll() {
        return redis.get(CacheKey.SY_I18N_ALL, Map.class)
                .map(m -> (Map<String, Map<String, String>>) m);
    }

    /** get — 조회 */
    public Optional<String> get(String locale, String msgKey) {
        return redis.get(CacheKey.SY_I18N_MSG + locale + ":" + msgKey, String.class);
    }

    // ── 삭제 (evict) ──────────────────────────────────────────────

    /* evictAll */
    public void evictAll() {
        redis.delete(CacheKey.SY_I18N_ALL);
        redis.deleteByPattern(CacheKey.SY_I18N_MSG + "*");
    }

    /** isEnabled — 여부 */
    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
