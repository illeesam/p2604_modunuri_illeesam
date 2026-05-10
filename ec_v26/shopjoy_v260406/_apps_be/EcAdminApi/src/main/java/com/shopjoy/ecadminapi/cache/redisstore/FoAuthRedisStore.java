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
 * FO(Front Office) 회원 세션 캐시.
 *
 * 저장 항목:
 *   - 세션 정보      : auth:session:{userId}   → Map (userId, AppType, gradeId, siteId, loginAt)
 *   - 토큰 블랙리스트 : auth:blacklist:{token}  → "1"
 *
 * TTL: app.redis.ttl.fo-auth-seconds (기본 900s)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FoAuthRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 세션 정보 ─────────────────────────────────────────────────

    public void saveSession(String userId, Map<String, Object> sessionInfo) {
        redis.set(CacheKey.FO_AUTH_SESSION + userId, sessionInfo, props.getTtl().getFoAuthSeconds());
        log.info("[Cache][redis] [fo:auth:session][{}] saveSession()", userId);
    }

    /** getSession — 조회 */
    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getSession(String userId) {
        return redis.get(CacheKey.FO_AUTH_SESSION + userId, Map.class)
                .map(m -> (Map<String, Object>) m);
    }

    /** removeSession — 삭제 */
    public void removeSession(String userId) {
        redis.delete(CacheKey.FO_AUTH_SESSION + userId);
    }

    // ── 토큰 블랙리스트 ───────────────────────────────────────────

    public void blacklistToken(String token, long remainingTtlSeconds) {
        if (remainingTtlSeconds <= 0) return;
        redis.set(CacheKey.FO_AUTH_BLACKLIST + token, "1", remainingTtlSeconds);
        log.info("[Cache][redis] [fo:auth:blacklist] blacklistToken()— ttl={}s", remainingTtlSeconds);
    }

    /** isBlacklisted — 여부 */
    public boolean isBlacklisted(String token) {
        return redis.exists(CacheKey.FO_AUTH_BLACKLIST + token);
    }

    /** isEnabled — 여부 */
    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
