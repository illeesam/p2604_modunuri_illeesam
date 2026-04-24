package com.shopjoy.ecadminapi.common.config;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtAuthFilter;
import com.shopjoy.ecadminapi.common.license.LicenseFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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

import java.util.List;

/**
 * Spring Security 설정.
 *
 * 인증 방식: JWT Stateless (세션 미사용)
 * CORS: localhost 전 포트 허용
 *
 * URL 인가 규칙:
 *   /api/base/**   GET              → 누구나 (permitAll)
 *   /api/base/**   POST/PUT/DELETE  → BO만
 *   /api/fo/ec/my/**               → FO만
 *   /api/**        GET              → BO 또는 FO
 *   /api/**        POST/PUT/PATCH/DELETE → BO만
 *   /autoRest/**   GET              → BO 또는 FO
 *   /autoRest/**   POST/PUT/PATCH/DELETE → BO만
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
    private final LicenseFilter   licenseFilter;
    private final UserDetailsService userDetailsService;

    /** BO만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> BO_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.BO));

    /** BO 또는 FO 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> BO_OR_FO =
        (supplier, ctx) -> {
            Authentication auth = supplier.get();
            return new AuthorizationDecision(
                isUserType(auth, AuthPrincipal.BO) || isUserType(auth, AuthPrincipal.FO)
            );
        };

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
                // /api/auth/bo/me, /api/auth/fo/me 는 인증 필수
                // .requestMatchers("/api/auth/bo/me", "/api/auth/fo/me").access(BO_OR_FO)
                // 나머지 인증 엔드포인트는 누구나 (login/join/refresh/logout)
                .requestMatchers("/api/auth/bo/**", "/api/auth/fo/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // static 리소스 — 인증 없이 허용
                .requestMatchers(HttpMethod.GET, "/cdn/**", "/zz/**").permitAll()

                // /api/co/cm/fo-app-store/**, /api/co/cm/bo-app-store/** — 누구나 허용 (초기화 데이터 조회)
                // ⭐ 더 구체적이므로 일반 /api/** 규칙보다 먼저 배치
                .requestMatchers("/api/co/cm/fo-app-store/**").permitAll()
                .requestMatchers("/api/co/cm/bo-app-store/**").permitAll()

                // /api/base/** — GET 누구나, 변경(POST/PUT/PATCH/DELETE) USER만
                .requestMatchers(HttpMethod.GET,    "/api/base/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/base/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PUT,    "/api/base/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PATCH,  "/api/base/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.DELETE, "/api/base/**").access(BO_ONLY)

                // /api/fo/ec/my/** — MEMBER만 (더 구체적인 경로 먼저)
                .requestMatchers("/api/fo/ec/my/**").access(FO_ONLY)

                // /api/fo/ec/**, /api/bo/cm/**, /api/base/cm/** — 누구나 허용
                .requestMatchers("/api/fo/ec/**").permitAll()
                .requestMatchers("/api/base/cm/**").permitAll()

                // /api/bo/sy/** (BO 시스템) — GET: 누구나 / 변경: BO만
                .requestMatchers(HttpMethod.GET,    "/api/bo/sy/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/bo/sy/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PUT,    "/api/bo/sy/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PATCH,  "/api/bo/sy/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.DELETE, "/api/bo/sy/**").access(BO_ONLY)

                // /api/ext/** — EXT(외부 시스템)만 허용
                .requestMatchers("/api/ext/**").access(EXT_ONLY)

                // /api/**, /api/autoRest/** — GET: USER or MEMBER / 변경: USER만
                .requestMatchers(HttpMethod.GET,    "/api/**").access(BO_OR_FO)
                .requestMatchers(HttpMethod.POST,   "/api/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PUT,    "/api/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.PATCH,  "/api/**").access(BO_ONLY)
                .requestMatchers(HttpMethod.DELETE, "/api/**").access(BO_ONLY)

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(licenseFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        SecurityFilterChain chain = http.build();
        log.info("[SecurityConfig] SecurityFilterChain 등록 완료 — JWT Stateless, JwtAuthFilter 활성");
        return chain;
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
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
