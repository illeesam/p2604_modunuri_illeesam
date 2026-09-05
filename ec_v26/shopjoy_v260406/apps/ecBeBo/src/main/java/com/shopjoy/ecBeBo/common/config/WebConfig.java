package com.shopjoy.ecBeBo.common.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
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
     * <p>2026-08-30: 원래 origin 패턴이 '*'(진짜 와일드카드)였는데, SecurityConfig 의
     * corsConfigurationSource() 는 이미 CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS 로 제한돼
     * 있어서 두 CORS 설정이 서로 어긋나 있었다 — 실제로는 Security 필터 체인 쪽이 먼저 평가돼
     * 지금까지 문제가 드러나진 않았지만, 두 설정이 다른 채로 두는 건 유지보수 리스크라 같은
     * 상수를 쓰도록 통일한다.</p>
     *
     * @param registry 스프링이 제공하는 {@link CorsRegistry}
     *                 CorsOriginPolicy 목록의 origin + 자격증명 허용 + 7200초 preflight 캐시를 적용
     */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
            .allowedOriginPatterns(CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS.toArray(new String[0]))
            .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
            .allowedHeaders("*")
            .allowCredentials(true)
            .maxAge(7200);  // 2시간 — Chrome 상한, preflight 빈도 최소화
        log.info("[WebConfig] CORS 설정 완료 — SecurityConfig 와 동일 origin 정책(CorsOriginPolicy), maxAge=7200s");
    }

    /**
     * CDN 정적 리소스 핸들러를 등록한다.
     *
     * <p>{@code /cdn/**} URL 을 {@link #physicalRoot} 의 절대 파일 경로(file:// URI)로 매핑해
     * 로컬 디스크의 정적 자원을 서빙한다. classpath 가 아닌 외부 물리 경로를 사용하므로
     * 상대경로를 절대 URI 로 변환해 적용한다.</p>
     *
     * <p>⚠ 2026-09-06 버그수정: {@code Path.toUri()}는 그 경로가 "디렉터리"인지를 파일시스템에
     * 직접 물어봐서, 실제 존재하는 디렉터리면 트레일링 슬래시("/")를 붙이고 없으면 안 붙인다.
     * 이 컨테이너는 jar만 담아 뜨므로(Dockerfile 참조) 첫 부팅 시점엔 {@code physicalRoot} 폴더
     * 자체가 아직 없다 — 그 상태로 이 메서드가 실행되면 슬래시 없는 URI("file:.../static/cdn",
     * 끝에 "/" 없음)가 리소스 위치로 그대로 등록되고, Spring 은 "/"로 안 끝나는 리소스 위치를
     * 디렉터리로 취급하지 않아 그 아래 어떤 파일도 영원히 못 찾는다(부팅 이후 그 폴더가 생기고
     * 실제 파일이 저장돼도 이미 등록된 잘못된 위치는 재평가되지 않음 — 첨부파일이 항상 404 나던
     * 실제 원인, 2026-09-06 관리자 공지사항 화면에서 발견). 그래서 여기서 먼저 디렉터리 존재를
     * 보장한 뒤 URI 를 만들고, 혹시 몰라 트레일링 슬래시도 한 번 더 방어적으로 붙인다.</p>
     *
     * @param registry 스프링이 제공하는 {@link ResourceHandlerRegistry}(@NonNull 보장)
     */
    @Override
    public void addResourceHandlers(@NonNull ResourceHandlerRegistry registry) {
        Path root = Paths.get(physicalRoot).toAbsolutePath();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            log.warn("[WebConfig] CDN 물리 루트 디렉터리 생성 실패(무시하고 계속 진행): {} — {}", root, e.getMessage());
        }
        String absPath = root.toUri().toString();
        if (!absPath.endsWith("/")) absPath += "/"; // 방어적 보정 — 위 createDirectories 가 실패해도 최소한의 안전망
        registry.addResourceHandler("/cdn/**")
                .addResourceLocations(absPath);
        log.info("[WebConfig] CDN static 매핑 — /cdn/** → {}", absPath);
    }
}
