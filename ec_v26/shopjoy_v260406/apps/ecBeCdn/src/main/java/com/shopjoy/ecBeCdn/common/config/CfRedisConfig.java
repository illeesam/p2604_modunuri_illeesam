package com.shopjoy.eccdnapi.common.config;

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
 * Redis 연결 및 RedisTemplate 빈 구성 — EcAdminApi 의 cache/config/RedisConfig.java 를 그대로
 * 참고해 이식했다(요청사항: "EcCdnApi 프로그램 참고해줘" 관례 연장선). app.redis.enabled=true
 * 일 때만 이 Configuration 전체가 활성화된다(스위치 — 요청사항: "redis switch 될수 있게 해줘").
 * EcCdnApi 는 노드 하나만 쓰므로 primary 만 둔다(EcAdminApi 의 secondary 개념 생략).
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true")
public class CfRedisConfig {

    private final CfRedisProperties props;

    @Bean
    public RedisTemplate<String, Object> redisTemplate() {
        CfRedisProperties.Node node = props.getPrimary();
        log.info("[Redis] 연결 — {}:{}/db{}", node.getHost(), node.getPort(), node.getDatabase());
        return buildTemplate(createFactory(node));
    }

    private LettuceConnectionFactory createFactory(CfRedisProperties.Node node) {
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
