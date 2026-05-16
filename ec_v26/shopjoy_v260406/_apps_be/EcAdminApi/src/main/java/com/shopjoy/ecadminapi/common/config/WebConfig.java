package com.shopjoy.ecadminapi.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * Spring MVC 웹 설정.
 *
 * <p>역할/책임: MVC 레벨 CORS 매핑과 CDN 정적 리소스 핸들러를 등록한다.
 * Spring Security 의 {@code corsConfigurationSource}(SecurityConfig)는 시큐리티 필터
 * 체인 단계의 CORS 를, 이 클래스는 MVC 디스패처 단계의 CORS 를 담당한다(둘은 보완 관계).</p>
 *
 * <p>동작 시점: 앱 기동 시 {@link WebMvcConfigurer} 콜백으로 1회 적용된다.</p>
 *
 * <p>주의: CDN 물리 경로는 프로퍼티 {@code app.file.local.physical-root} 로 외부화되어
 * 환경별로 달라질 수 있다.</p>
 */
@Slf4j
@Configuration
public class WebConfig implements WebMvcConfigurer {

    /** CDN 정적 파일이 위치한 물리 루트 경로. 미설정 시 기본값 {@code src/main/resources/static/cdn}. */
    @Value("${app.file.local.physical-root:src/main/resources/static/cdn}")
    private String physicalRoot;

    /**
     * MVC 전역 CORS 매핑을 등록한다.
     *
     * @param registry 스프링이 제공하는 {@link CorsRegistry}
     *                 모든 경로(/**)에 origin 패턴 '*' + 자격증명 허용 + 7200초 preflight
     *                 캐시를 적용한다(maxAge=7200 은 Chrome preflight 캐시 상한)
     */
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

    /**
     * CDN 정적 리소스 핸들러를 등록한다.
     *
     * <p>{@code /cdn/**} URL 을 {@link #physicalRoot} 의 절대 파일 경로(file:// URI)로 매핑해
     * 로컬 디스크의 정적 자원을 서빙한다. classpath 가 아닌 외부 물리 경로를 사용하므로
     * 상대경로를 절대 URI 로 변환해 적용한다.</p>
     *
     * @param registry 스프링이 제공하는 {@link ResourceHandlerRegistry}(@NonNull 보장)
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        String absPath = Paths.get(physicalRoot).toAbsolutePath().toUri().toString();
        registry.addResourceHandler("/cdn/**")
                .addResourceLocations(absPath);
        log.info("[WebConfig] CDN static 매핑 — /cdn/** → {}", absPath);
    }
}
