package com.shopjoy.ecadminapi.common.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS 설정.
 *
 * 개발 환경에서 Vue 개발 서버(Live Server 5501 등)와 Spring Boot(8080)가 다른 Origin이므로
 * 모든 출처를 허용한다. 운영 배포 시 allowedOriginPatterns를 실제 도메인으로 제한할 것.
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(3600); // preflight 캐시 1시간
    }
}
