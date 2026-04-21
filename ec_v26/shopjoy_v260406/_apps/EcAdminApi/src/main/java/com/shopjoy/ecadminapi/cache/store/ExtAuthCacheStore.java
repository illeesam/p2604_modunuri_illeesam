package com.shopjoy.ecadminapi.cache.store;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * EXT(External) 외부 시스템·API 키 세션 캐시.
 *
 * 저장 항목:
 *   - 세션 정보      : auth:session:{userId}   → Map (userId, userType, vendorId, loginAt)
 *   - 토큰 블랙리스트 : auth:blacklist:{token}  → "1"
 *
 * TTL: app.redis.ttl.ext-auth-seconds (기본 900s)
 */
@Component
@RequiredArgsConstructor
public class ExtAuthCacheStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 세션 정보 ─────────────────────────────────────────────────

    public void saveSession(String userId, Map<String, Object> sessionInfo) {
        redis.set(CacheKey.EXT_AUTH_SESSION + userId, sessionInfo, props.getTtl().getExtAuthSeconds());
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getSession(String userId) {
        return redis.get(CacheKey.EXT_AUTH_SESSION + userId, Map.class)
                .map(m -> (Map<String, Object>) m);
    }

    public void removeSession(String userId) {
        redis.delete(CacheKey.EXT_AUTH_SESSION + userId);
    }

    // ── 토큰 블랙리스트 ───────────────────────────────────────────

    public void blacklistToken(String token, long remainingTtlSeconds) {
        if (remainingTtlSeconds <= 0) return;
        redis.set(CacheKey.EXT_AUTH_BLACKLIST + token, "1", remainingTtlSeconds);
    }

    public boolean isBlacklisted(String token) {
        return redis.exists(CacheKey.EXT_AUTH_BLACKLIST + token);
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
