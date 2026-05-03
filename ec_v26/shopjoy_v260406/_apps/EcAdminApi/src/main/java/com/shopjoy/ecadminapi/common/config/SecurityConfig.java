package com.shopjoy.ecadminapi.common.config;

import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.co.auth.security.JwtAuthFilter;
//import com.shopjoy.ecadminapi.common.license.LicenseFilter;
import com.shopjoy.ecadminapi.common.log.ErrorLogQueue;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Spring Security 설정.
 *
 * 인증 방식: JWT Stateless (세션 미사용)
 * CORS: localhost 전 포트 허용
 *
 * URL 인가 규칙 (경로 프리픽스 기준):
 *   /api/co/**   → 누구나 (permitAll) — 로그인·공통코드·사용자선택·파일 등
 *   /api/fo/**   → FO만 (MEMBER)
 *   /api/bo/**   → BO만 (USER)
 *   /api/base/** → 완전 차단 (denyAll) — 내부 공통 레이어, 외부 직접 호출 금지
 *   /api/ext/**  → EXT(외부 시스템)만
 *
 * 어노테이션 방식 (개별 메서드 예외 처리):
 *   @BoOnly  → BO만
 *   @FoOnly  → FO만
 *   @BoOrFo  → BO 또는 FO
 *   @ExtOnly → EXT(외부 시스템)만
 *
 * 필터 순서: JwtAuthFilter → UsernamePasswordAuthenticationFilter
 */
@Slf4j
@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // @BoOnly / @BoOrFo 어노테이션 활성화
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter   jwtAuthFilter;
//    private final LicenseFilter   licenseFilter;
    private final UserDetailsService userDetailsService;
    private final ErrorLogQueue   errorLogQueue;

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** BO만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> BO_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.BO));

    /** FO만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> FO_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.FO));

    /** EXT(외부 시스템)만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> EXT_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.EXT));

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()           // CORS preflight
                .requestMatchers(HttpMethod.GET, "/cdn/**", "/zz/**").permitAll() // static 리소스
                .requestMatchers("/actuator/**").permitAll()       // Spring Boot Actuator (헬스체크·메트릭 등)
                .requestMatchers("/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/swagger-resources/**", "/webjars/**").permitAll() // Swagger UI

                .requestMatchers("/api/co/**").permitAll()      // 공통 API: 누구나
                .requestMatchers("/api/fo/**").access(FO_ONLY)  // FO 전용: 회원만
                .requestMatchers("/api/bo/**").access(BO_ONLY)  // BO 전용: 관리자만
                .requestMatchers("/api/base/**").denyAll()       // 내부 레이어: 완전 차단
                .requestMatchers("/api/ext/**").access(EXT_ONLY) // 외부 시스템만

                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .accessDeniedHandler((request, response, e) -> {
                    String uri = request.getRequestURI();
                    String msg = "접근 권한이 없습니다. (" + (uri.contains("/api/bo/") ? "BO" : uri.contains("/api/fo/") ? "FO" : uri.contains("/api/base/") ? "BASE" : "-") + ")";
                    // 에러 큐에 직접 적재
                    Map<String, String> mdc = MDC.getCopyOfContextMap();
                    if (mdc == null) mdc = Map.of();
                    String logId = "EL" + LocalDateTime.now().format(ID_FMT)
                        + String.format("%04d", (int)(Math.random() * 10000));
                    errorLogQueue.offer(SyhAccessErrorLog.builder()
                        .logId(logId)
                        .reqMethod(mdc.getOrDefault("reqMethod", request.getMethod()))   // HTTP 메서드 (GET/POST 등)
                        .reqHost(mdc.getOrDefault("reqHost", request.getServerName()))   // 요청 호스트명
                        .reqPath(mdc.getOrDefault("reqPath", uri))                       // 요청 경로
                        .reqQuery(mdc.getOrDefault("reqQuery", request.getQueryString())) // 쿼리스트링
                        .reqIp(mdc.getOrDefault("reqIp", request.getRemoteAddr()))       // 클라이언트 IP
                        .userTypeCd(mdc.getOrDefault("userTypeCd", "-"))                 // 사용자 유형 (BO/FO/-)
                        .userId(mdc.getOrDefault("authId", "-"))                         // 인증된 사용자 ID
                        .roleId(mdc.getOrDefault("roleId", null))                        // 권한 ID
                        .deptId(mdc.getOrDefault("deptId", null))                        // 부서 ID
                        .vendorId(mdc.getOrDefault("vendorId", null))                    // 업체 ID
                        .uiNm(mdc.getOrDefault("uiNm", null))                            // 화면명 (X-UI-Nm 헤더)
                        .cmdNm(mdc.getOrDefault("cmdNm", null))                          // 커맨드명 (X-Cmd-Nm 헤더)
                        .traceId(mdc.getOrDefault("traceId", null))                      // 요청 추적 ID
                        .errorType("AccessDeniedException")                               // 에러 유형: 접근 거부
                        .errorMsg(msg)
                        .logDt(LocalDateTime.now())
                        .regDate(LocalDateTime.now())
                        .build());
                    log.warn("[SecurityConfig] AccessDenied [403]: {} | uri={}", msg, uri);
                    response.setStatus(403);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    response.getWriter().write("{\"status\":403,\"message\":\"" + msg + "\"}");
                })
            )
            .authenticationProvider(authenticationProvider())
//            .addFilterBefore(licenseFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        SecurityFilterChain chain = http.build();
        log.info("[SecurityConfig] SecurityFilterChain 등록 완료 — JWT Stateless, JwtAuthFilter 활성");
        return chain;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "https://localhost:*", "http://127.0.0.1:*", "https://127.0.0.1:*", "http://illeesam.synology.me:*", "https://illeesam.synology.me:*", "http://illeesam.netlify.app", "https://illeesam.netlify.app"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private static boolean isUserType(Authentication auth, String type) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return type.equals(p.userTypeCd());
        }
        return false;
    }
}
