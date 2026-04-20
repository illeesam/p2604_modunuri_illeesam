package com.shopjoy.ecadminapi.common.config;

import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
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
 *   /api/base/**   POST/PUT/DELETE  → USER만
 *   /api/fo/ec/my/**               → MEMBER만
 *   /api/**        GET              → USER 또는 MEMBER
 *   /api/**        POST/PUT/PATCH/DELETE → USER만
 *   /autoRest/**   GET              → USER 또는 MEMBER
 *   /autoRest/**   POST/PUT/PATCH/DELETE → USER만
 *
 * 어노테이션 방식 (개별 메서드 예외 처리):
 *   @UserOnly      → USER만
 *   @MemberOnly    → MEMBER만
 *   @UserOrMember  → USER 또는 MEMBER
 *
 * 필터 순서: JwtAuthFilter → UsernamePasswordAuthenticationFilter
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity          // @UserOnly / @UserOrMember 어노테이션 활성화
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsService userDetailsService;

    /** USER만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> USER_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.USER));

    /** USER 또는 MEMBER 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> USER_OR_MEMBER =
        (supplier, ctx) -> {
            Authentication auth = supplier.get();
            return new AuthorizationDecision(
                isUserType(auth, AuthPrincipal.USER) || isUserType(auth, AuthPrincipal.MEMBER)
            );
        };

    /** MEMBER만 허용 */
    private static final AuthorizationManager<RequestAuthorizationContext> MEMBER_ONLY =
        (supplier, ctx) -> new AuthorizationDecision(isUserType(supplier.get(), AuthPrincipal.MEMBER));

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/auth/bo/**", "/auth/fo/**").permitAll()
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // /api/base/** — GET 누구나, 변경(POST/PUT/PATCH/DELETE) USER만
                .requestMatchers(HttpMethod.GET,    "/api/base/**").permitAll()
                .requestMatchers(HttpMethod.POST,   "/api/base/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.PUT,    "/api/base/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.PATCH,  "/api/base/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.DELETE, "/api/base/**").access(USER_ONLY)

                // /api/fo/ec/my/** — MEMBER만 (더 구체적인 경로 먼저)
                .requestMatchers("/api/fo/ec/my/**").access(MEMBER_ONLY)

                // /api/fo/ec/** — 누구나 (my/** 제외한 FO EC 전체)
                .requestMatchers("/api/fo/ec/**").permitAll()

                // /api/**, /autoRest/** — GET: USER or MEMBER / 변경: USER만
                .requestMatchers(HttpMethod.GET,    "/api/**", "/autoRest/**").access(USER_OR_MEMBER)
                .requestMatchers(HttpMethod.POST,   "/api/**", "/autoRest/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.PUT,    "/api/**", "/autoRest/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.PATCH,  "/api/**", "/autoRest/**").access(USER_ONLY)
                .requestMatchers(HttpMethod.DELETE, "/api/**", "/autoRest/**").access(USER_ONLY)

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
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
            return type.equals(p.userType());
        }
        return false;
    }
}
