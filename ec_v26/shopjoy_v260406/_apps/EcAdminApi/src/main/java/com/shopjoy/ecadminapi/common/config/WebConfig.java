package com.shopjoy.ecadminapi.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${app.file.local.physical-root:src/main/resources/static/cdn}")
    private String physicalRoot;

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns("*")
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(7200);  // 2시간 — Chrome 상한, preflight 빈도 최소화
        log.info("[WebConfig] CORS 설정 완료 — allowedOriginPatterns=*, maxAge=7200s");
    }

    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String absPath = Paths.get(physicalRoot).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/cdn/**")
                .addResourceLocations(absPath);
        log.info("[WebConfig] CDN static 매핑 — /cdn/** → {}", absPath);
    }
}
