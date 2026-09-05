package com.shopjoy.ecBeCdn.auth.redisstore;

import com.shopjoy.ecBeCdn.common.config.CfRedisProperties;
import com.shopjoy.ecBeCdn.common.config.CfRedisUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.Optional;

/**
 * EcBeCdn 인증(cf_client) 세션 캐시 — EcBeBo 의
 * cache/redisstore/BoAuthRedisStore.java 를 그대로 참고해 이식했다(요청사항: "redis 인증
 * 연동해줘"). DB(cf_token/cf_token_hist)가 항상 source of truth 이며, 이 클래스는 순수 조회
 * 편의용 캐시 + 강제폐기 즉시무효화(blacklist) 용도일 뿐이다 — app.redis.enabled=false(스위치
 * 꺼짐) 여도 로그인/재발급/강제폐기 로직 자체는 그대로 동작한다(내부가 전부 no-op 이 될 뿐).
 *
 * <p>저장 항목:</p>
 * <ul>
 *   <li>세션 정보: {@code cf:auth:session:{clientId}} → Map(tokenId, issuedIp, requesterSystemNm, loginAt)</li>
 *   <li>토큰 블랙리스트: {@code cf:auth:blacklist:{accessToken}} → "1" — 강제폐기(revoke) 시
 *       그 accessToken 은 자연만료(최대 30초) 전이라도 refresh() 초입에서 즉시 거절된다.</li>
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CfAuthRedisStore {

    private static final String SESSION_PREFIX = "cf:auth:session:";
    private static final String BLACKLIST_PREFIX = "cf:auth:blacklist:";

    private final CfRedisUtil redis;
    private final CfRedisProperties props;

    // ── 세션 정보(조회 편의용 캐시) ──────────────────────────────────

    public void saveSession(String clientId, Map<String, Object> sessionInfo, long ttlSeconds) {
        long ttl = ttlSeconds > 0 ? ttlSeconds : props.getAuthSessionSeconds();
        redis.set(SESSION_PREFIX + clientId, sessionInfo, ttl);
        log.info("[Cache][redis] [cf:auth:session][{}] saveSession()", clientId);
    }

    @SuppressWarnings("unchecked")
    public Optional<Map<String, Object>> getSession(String clientId) {
        return redis.get(SESSION_PREFIX + clientId, Map.class).map(m -> (Map<String, Object>) m);
    }

    public void removeSession(String clientId) {
        redis.delete(SESSION_PREFIX + clientId);
    }

    // ── 토큰 블랙리스트(강제폐기 즉시무효화) ──────────────────────────

    /** remainingTtlSeconds = 그 accessToken 의 남은 유효시간(초). 0 이하면 이미 자연만료된 것이므로 스킵. */
    public void blacklistToken(String accessToken, long remainingTtlSeconds) {
        if (accessToken == null || accessToken.isBlank() || remainingTtlSeconds <= 0) return;
        redis.set(BLACKLIST_PREFIX + accessToken, "1", remainingTtlSeconds);
        log.info("[Cache][redis] [cf:auth:blacklist] blacklistToken() — ttl={}s", remainingTtlSeconds);
    }

    public boolean isBlacklisted(String accessToken) {
        if (accessToken == null || accessToken.isBlank()) return false;
        return redis.exists(BLACKLIST_PREFIX + accessToken);
    }

    public boolean isEnabled() {
        return redis.isEnabled();
    }
}
