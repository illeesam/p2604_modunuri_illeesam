package com.shopjoy.ecBeCdn.common.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Optional;

/**
 * Redis 공통 유틸 — EcAdminApi 의 cache/config/RedisUtil.java 를 그대로 참고해 이식했다
 * (요청사항: "EcCdnApi 프로그램 참고해줘"). app.redis.enabled=false(스위치 꺼짐)면 모든 메서드가
 * no-op/empty 를 반환해 호출 측이 null 체크 없이 그냥 써도 되게 한다 — DB(cf_token)가 항상
 * source of truth 이고 이 클래스는 조회 편의용 캐시일 뿐이라, 꺼져 있어도 인증 로직 자체는
 * 100% 그대로 동작한다(요청사항: "redis switch 될수 있게 해줘").
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CfRedisUtil {

    private final CfRedisProperties props;

    @Autowired(required = false)
    private RedisTemplate<String, Object> redisTemplate;

    public <T> Optional<T> get(String key, Class<T> type) {
        if (!isEnabled()) return Optional.empty();
        try {
            Object value = redisTemplate.opsForValue().get(key);
            if (value == null) return Optional.empty();
            return Optional.of(type.cast(value));
        } catch (Exception e) {
            log.warn("[Redis] get 실패 key={} : {}", key, e.getMessage());
            return Optional.empty();
        }
    }

    public boolean set(String key, Object value, long ttlSeconds) {
        if (!isEnabled()) return false;
        try {
            redisTemplate.opsForValue().set(key, value, Duration.ofSeconds(Math.max(1, ttlSeconds)));
            return true;
        } catch (Exception e) {
            log.warn("[Redis] set 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    public boolean delete(String key) {
        if (!isEnabled()) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.delete(key));
        } catch (Exception e) {
            log.warn("[Redis] delete 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    public boolean exists(String key) {
        if (!isEnabled()) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(key));
        } catch (Exception e) {
            log.warn("[Redis] exists 실패 key={} : {}", key, e.getMessage());
            return false;
        }
    }

    /** Redis 사용 가능 여부(enabled=true 이고 빈이 실제로 뜬 경우). */
    public boolean isEnabled() {
        return props.isEnabled() && redisTemplate != null;
    }
}
