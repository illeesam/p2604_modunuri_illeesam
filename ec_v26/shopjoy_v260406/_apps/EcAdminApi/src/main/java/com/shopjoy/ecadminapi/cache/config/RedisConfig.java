package com.shopjoy.ecadminapi.cache.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.StringRedisSerializer;
import org.springframework.util.StringUtils;

import java.time.Duration;

/**
 * Redis 연결 및 RedisTemplate 빈 구성.
 *
 * app.redis.enabled=true 일 때만 활성화된다.
 * primary  : 항상 생성 (enabled=true 이면)
 * secondary: app.redis.secondary.host 가 설정된 경우에만 생성
 *
 * 직렬화 전략:
 *   Key   : StringRedisSerializer
 *   Value : GenericJackson2JsonRedisSerializer (JSON + @class 타입 정보 포함)
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class RedisConfig {

    private final RedisProperties props;

    /** primaryRedisTemplate */
    @Bean("primaryRedisTemplate")
    public RedisTemplate<String, Object> primaryRedisTemplate() {
        RedisProperties.Node node = props.getPrimary();
        log.info("[Redis] primary 연결 — {}:{}/db{}", node.getHost(), node.getPort(), node.getDatabase());
        return buildTemplate(createFactory(node));
    }

    /** secondaryRedisTemplate */
    @Bean("secondaryRedisTemplate")
    @ConditionalOnProperty(name = "app.redis.secondary.host")
    public RedisTemplate<String, Object> secondaryRedisTemplate() {
        RedisProperties.Node node = props.getSecondary();
        log.info("[Redis] secondary 연결 — {}:{}/db{}", node.getHost(), node.getPort(), node.getDatabase());
        return buildTemplate(createFactory(node));
    }

    // ── 팩토리 ────────────────────────────────────────────────────────

    private LettuceConnectionFactory createFactory(RedisProperties.Node node) {
        RedisStandaloneConfiguration config = new RedisStandaloneConfiguration();
        config.setHostName(node.getHost());
        config.setPort(node.getPort());
        config.setDatabase(node.getDatabase());
        if (StringUtils.hasText(node.getPassword())) {
            config.setPassword(node.getPassword());
        }

        LettuceClientConfiguration client = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(node.getTimeout()))
                .build();

        LettuceConnectionFactory factory = new LettuceConnectionFactory(config, client);
        factory.afterPropertiesSet();
        return factory;
    }

    /** buildTemplate — 구성 */
    private RedisTemplate<String, Object> buildTemplate(RedisConnectionFactory factory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(factory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}
