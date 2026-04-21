package com.shopjoy.ecadminapi.cache.redisstore;

import com.shopjoy.ecadminapi.cache.config.CacheKey;
import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.config.RedisUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * BO(Back Office) 관리자 세션 캐시.
 *
 * 저장 항목:
 *   - 세션 정보      : auth:session:{userId}   → Map (userId, userType, roleId, deptId, loginAt)
 *   - 토큰 블랙리스트 : auth:blacklist:{token}  → "1"
 *
 * TTL: app.redis.ttl.bo-auth-seconds (기본 900s)
 */
@Component
@RequiredArgsConstructor
public class BoAuthRedisStore {

    private final RedisUtil        redis;
    private final RedisProperties  props;

    // ── 세션 정보 ─────────────────────────────────────────────────

    public void saveSession(String userId, Map<String, Object> sessionInfo) {
        redis.set(CacheKey.BO_AUTH_SESSION + userId, sessionInfo, props.getTtl().getBoAuthSeconds());
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getSession(String userId) {
        return redis.get(CacheKey.BO_AUTH_SESSION + userId, Map.class)
                .map(m -> (Map<String, Object>) m);
    }

    public void removeSession(String userId) {
        redis.delete(CacheKey.BO_AUTH_SESSION + userId);
    }

    // ── 토큰 블랙리스트 ───────────────────────────────────────────

    /** 로그아웃된 토큰 등록. remainingTtl = 해당 토큰의 남은 유효시간(초) */
    public void blacklistToken(String token, long remainingTtlSeconds) {
        if (remainingTtlSeconds <= 0) return;
        redis.set(CacheKey.BO_AUTH_BLACKLIST + token, "1", remainingTtlSeconds);
    }

    /** 블랙리스트 등록 여부 확인 → true 이면 토큰 사용 불가 */
    public boolean isBlacklisted(String token) {
        return redis.exists(CacheKey.BO_AUTH_BLACKLIST + token);
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
