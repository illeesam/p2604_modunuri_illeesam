package com.shopjoy.ecadminapi.cache.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;

/**
 * Redis 공통 유틸.
 *
 * app.redis.enabled=false 이면 모든 메서드가 no-op / empty 반환 → 호출 측 null 체크 불필요.
 *
 * Target:
 *   PRIMARY   → primary Redis (기본)
 *   SECONDARY → secondary Redis. secondary 미설정 시 primary 로 자동 fallback.
 *
 * 직렬화: GenericJackson2JsonRedisSerializer (JSON + @class 타입 메타 포함)
 *   get() 반환 시 type.cast() 로 변환. LinkedHashMap 등 중간 타입이 올 경우
 *   서비스 레이어에서 ObjectMapper.convertValue() 로 변환 권장.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class RedisUtil {

    public enum Target { PRIMARY, SECONDARY }

    private final RedisProperties props;

    @Autowired(required = false)
    @Qualifier("primaryRedisTemplate")
    private RedisTemplate<String, Object> primaryTemplate;

    @Autowired(required = false)
    @Qualifier("secondaryRedisTemplate")
    private RedisTemplate<String, Object> secondaryTemplate;

    // ── 조회 ──────────────────────────────────────────────────────

    public <T> Optional<T> get(String key, Class<T> type) {
        return get(key, type, Target.PRIMARY);
    }

    public <T> Optional<T> get(String key, Class<T> type, Target target) {
        if (!isEnabled()) return Optional.empty();
        try {
            Object value = tpl(target).opsForValue().get(key);
            if (value == null) return Optional.empty();
            return Optional.of(type.cast(value));
        } catch (Exception e) {
            log.warn("[Redis] get 실패 key={} : {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    // ── 저장 ──────────────────────────────────────────────────────

    public boolean set(String key, Object value, long ttlSeconds) {
        return set(key, value, ttlSeconds, Target.PRIMARY);
    }

    public boolean set(String key, Object value, long ttlSeconds, Target target) {
        if (!isEnabled()) return false;
        try {
            tpl(target).opsForValue().set(key, value, Duration.ofSeconds(ttlSeconds));
            return true;
        } catch (Exception e) {
            log.warn("[Redis] set 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    /** 키가 없을 때만 저장 (분산 락 / 중복 방지용) */
    public boolean setIfAbsent(String key, Object value, long ttlSeconds) {
        if (!isEnabled()) return false;
        try {
            Boolean result = tpl(Target.PRIMARY).opsForValue()
                    .setIfAbsent(key, value, Duration.ofSeconds(ttlSeconds));
            return Boolean.TRUE.equals(result);
        } catch (Exception e) {
            log.warn("[Redis] setIfAbsent 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    // ── 삭제 ──────────────────────────────────────────────────────

    public boolean delete(String key) {
        return delete(key, Target.PRIMARY);
    }

    public boolean delete(String key, Target target) {
        if (!isEnabled()) return false;
        try {
            return Boolean.TRUE.equals(tpl(target).delete(key));
        } catch (Exception e) {
            log.warn("[Redis] delete 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    /** 패턴으로 키 일괄 삭제 (예: "code:grp:*"). 운영 환경 주의 — SCAN 기반 */
    public long deleteByPattern(String pattern) {
        return deleteByPattern(pattern, Target.PRIMARY);
    }

    public long deleteByPattern(String pattern, Target target) {
        if (!isEnabled()) return 0;
        try {
            Set<String> keys = tpl(target).keys(pattern);
            if (keys == null || keys.isEmpty()) return 0;
            Long deleted = tpl(target).delete(keys);
            return deleted != null ? deleted : 0;
        } catch (Exception e) {
            log.warn("[Redis] deleteByPattern 실패 pattern={} : {}", pattern, e.getMessage());
            return 0;
        }
    }

    // ── TTL 조회 ──────────────────────────────────────────────────

    /** 남은 TTL(초) 반환. 키 없음=-2, TTL 없음=-1, 오류=-2 */
    public long getTtl(String key) {
        return getTtl(key, Target.PRIMARY);
    }

    public long getTtl(String key, Target target) {
        if (!isEnabled()) return -2;
        try {
            Long ttl = tpl(target).getExpire(key, TimeUnit.SECONDS);
            return ttl != null ? ttl : -2;
        } catch (Exception e) {
            log.warn("[Redis] getTtl 실패 key={} : {}", key, e.getMessage());
            return -2;
        }
    }

    /** 패턴에 매칭되는 키 수 반환 */
    public long countKeys(String pattern) {
        return countKeys(pattern, Target.PRIMARY);
    }

    public long countKeys(String pattern, Target target) {
        if (!isEnabled()) return 0;
        try {
            Set<String> keys = tpl(target).keys(pattern);
            return keys != null ? keys.size() : 0;
        } catch (Exception e) {
            log.warn("[Redis] countKeys 실패 pattern={} : {}", pattern, e.getMessage());
            return 0;
        }
    }

    // ── 존재 여부 ──────────────────────────────────────────────────

    public boolean exists(String key) {
        return exists(key, Target.PRIMARY);
    }

    public boolean exists(String key, Target target) {
        if (!isEnabled()) return false;
        try {
            return Boolean.TRUE.equals(tpl(target).hasKey(key));
        } catch (Exception e) {
            log.warn("[Redis] exists 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    // ── 상태 ──────────────────────────────────────────────────────

    /** Redis 사용 가능 여부 (enabled=true 이고 primary 연결됨) */
    public boolean isEnabled() {
        return props.isEnabled() && primaryTemplate != null;
    }

    /** secondary 사용 가능 여부 */
    public boolean hasSecondary() {
        return isEnabled() && secondaryTemplate != null;
    }

    // ── 내부 ──────────────────────────────────────────────────────

    private RedisTemplate<String, Object> tpl(Target target) {
        if (target == Target.SECONDARY && secondaryTemplate != null) return secondaryTemplate;
        return primaryTemplate;
    }
}
