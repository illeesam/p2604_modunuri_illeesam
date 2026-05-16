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

    /** 접근 거부 로그 ID 생성용 시각 포맷(yyMMddHHmmss). 뒤에 4자리 난수를 붙여 유니크 ID 구성. */
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** URL 인가용 AuthorizationManager — 인증 주체의 appTypeCd 가 BO 인 경우만 허용. */
    private static final AuthorizationManager<RequestAuthorizationContext> BO_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isAppType(supplier.get(), AuthPrincipal.BO));

    /** URL 인가용 AuthorizationManager — appTypeCd 가 FO 인 경우만 허용. */
    private static final AuthorizationManager<RequestAuthorizationContext> FO_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isAppType(supplier.get(), AuthPrincipal.FO));

    /** URL 인가용 AuthorizationManager — appTypeCd 가 EXT(외부 시스템)인 경우만 허용. */
    private static final AuthorizationManager<RequestAuthorizationContext> EXT_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isAppType(supplier.get(), AuthPrincipal.EXT));

    /**
     * 메인 보안 필터 체인 빈.
     *
     * <p>구성: CSRF 비활성(JWT Stateless), CORS 적용, 세션 STATELESS, URL 프리픽스별 인가 규칙,
     * 접근 거부(403) 핸들러(에러 로그 큐 적재 + JSON 응답), DaoAuthenticationProvider 등록,
     * {@code JwtAuthFilter} 를 {@link UsernamePasswordAuthenticationFilter} 앞에 삽입.</p>
     *
     * <p>인가 규칙 평가 순서가 중요하다: 더 구체적인 /api/fo/my/** 등을 먼저 FO_ONLY 로 막고,
     * 마지막 /api/fo/** 를 permitAll 로 두어 비로그인 FO 페이지를 허용한다.</p>
     *
     * @param http 스프링이 제공하는 {@link HttpSecurity} 빌더
     * @return 빌드된 {@link SecurityFilterChain}
     * @throws Exception HttpSecurity 구성/빌드 중 오류. 접근 거부 핸들러 내부에서
     *                   응답 쓰기 실패 시 발생하는 IOException 도 이 시그니처로 전파될 수 있음
     */
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

                .requestMatchers("/api/co/**").permitAll()          // 공통 API: 누구나
                .requestMatchers("/api/autoRest/**").permitAll()   // 자동 REST: 누구나
                // FO: 인증 필요 경로만 FO_ONLY, 나머지 전부 공개 (비로그인 허용)
                .requestMatchers("/api/fo/my/**").access(FO_ONLY)
                .requestMatchers("/api/fo/ec/my/**").access(FO_ONLY)
                .requestMatchers("/api/fo/ec/od/**").access(FO_ONLY)        // 장바구니·주문
                .requestMatchers("/api/fo/order/**").access(FO_ONLY)
                .requestMatchers("/api/fo/ec/mb/like/**").access(FO_ONLY)   // 찜
                .requestMatchers("/api/fo/ec/pm/cache/**").access(FO_ONLY)  // 캐시(캐쉬)
                .requestMatchers("/api/fo/ec/pm/coupon/**").access(FO_ONLY) // 쿠폰
                .requestMatchers("/api/fo/**").permitAll()                   // 나머지 FO 전부 공개
                .requestMatchers("/api/bo/**").access(BO_ONLY)     // BO 전용: 관리자만 (appTypeCd=BO)
                .requestMatchers("/api/base/**").denyAll()          // 내부 레이어: 완전 차단
                .requestMatchers("/api/ext/**").access(EXT_ONLY)   // 외부 시스템만 (appTypeCd=EXT)

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
                        .appTypeCd(mdc.getOrDefault("appTypeCd", "-"))                 // 앱 유형 (BO/FO/-)
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

    /**
     * CORS 설정 소스 빈.
     *
     * <p>localhost/127.0.0.1 전 포트 및 운영 도메인(synology, netlify)을 origin 패턴으로 허용한다.
     * 자격증명(쿠키·Authorization) 동반 요청을 허용하므로 origin 은 와일드카드(*) 가 아닌
     * 패턴 목록으로 한정한다(allowCredentials=true 와 '*' 는 브라우저가 거부).</p>
     *
     * @return 모든 경로(/**)에 동일 정책을 적용하는 {@link CorsConfigurationSource}.
     *         preflight 캐시(maxAge)는 7200초(=Chrome 상한)로 두어 OPTIONS 호출 빈도를 최소화
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "https://localhost:*", "http://127.0.0.1:*", "https://127.0.0.1:*", "http://illeesam.synology.me:*", "https://illeesam.synology.me:*", "http://illeesam.netlify.app", "https://illeesam.netlify.app"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(7200L);  // 2시간 — Chrome preflight 캐시 상한, 동일 origin 반복 호출 시 OPTIONS 빈도 최소화

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * DAO 기반 인증 프로바이더 빈.
     *
     * <p>{@link UserDetailsService} 로 사용자 조회 + {@link #passwordEncoder()}(BCrypt)로
     * 비밀번호 검증을 수행한다. 주로 로그인(아이디/비밀번호) 인증 흐름에서 사용된다.</p>
     *
     * @return 구성된 {@link DaoAuthenticationProvider}
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * 인증 매니저 빈.
     *
     * @param config 스프링이 제공하는 {@link AuthenticationConfiguration}
     * @return 컨테이너가 구성한 {@link AuthenticationManager}(로그인 서비스에서 주입해 사용)
     * @throws Exception AuthenticationManager 획득 실패 시
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * 비밀번호 인코더 빈.
     *
     * @return BCrypt 해시 인코더. 회원/관리자 비밀번호 저장·검증에 공통 사용
     *         (알고리즘 변경 시 기존 해시와의 호환성 주의)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    /**
     * 인증 주체의 앱 유형이 지정 타입과 일치하는지 판정한다(URL 인가 매니저 공통 헬퍼).
     *
     * @param auth 현재 Authentication(null 또는 미인증이면 false)
     * @param type 기대 앱 유형 상수(AuthPrincipal.BO/FO/EXT)
     * @return principal 이 {@link AuthPrincipal} 이고 appTypeCd 가 type 과 일치하면 true.
     *         principal 타입 불일치 시 false(익명/타 인증방식 차단)
     */
    private static boolean isAppType(Authentication auth, String type) {
        if (auth == null || !auth.isAuthenticated()) return false;
        if (auth.getPrincipal() instanceof AuthPrincipal p) {
            return type.equals(p.appTypeCd());
        }
        return false;
    }
}
