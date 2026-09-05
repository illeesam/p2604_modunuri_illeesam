package com.shopjoy.ecBeCdn.common.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * app.redis.* 설정 — EcAdminApi 의 cache/config/RedisProperties.java 를 그대로 참고해 이식했다
 * (요청사항: "redis 인증 연동해줘 단 redis switch 될수 있게 해줘"). EcCdnApi 는 노드 하나만
 * 쓰므로(primary/secondary 이원화 없음) 그 부분만 단순화했다.
 *
 * <p>enabled: false(기본) → Redis 미사용, CfRedisUtil 모든 연산이 no-op(스위치).</p>
 */
@Component
@ConfigurationProperties(prefix = "app.redis")
@Getter
@Setter
public class CfRedisProperties {

    private boolean enabled = false;

    private Node primary = new Node();

    /** 인증 세션 캐시 TTL(초) — 미사용 시 로그인/재발급 시점의 실제 accessTokenTtlSec 을 그대로 쓴다. */
    private long authSessionSeconds = 3600;

    @Getter
    @Setter
    public static class Node {
        private String host = "";
        private int port = 6379;
        private String password = "";
        private int database = 0;
        private int timeout = 3000; // 연결 타임아웃(ms)
    }
}
