package com.shopjoy.eccdnapi.common.config;

import com.shopjoy.eccdnapi.auth.security.CfTokenAuthFilter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

/**
 * Spring Security 설정.
 *
 * <p>2026-09-06 변경: 관리 화면(static/index.html, /api/cdn/**)은 로그인 없이 쓴다 — 요청사항
 * "여기에선 로그인 안해도 되". accessToken(30초)/로그인 체계 자체(CfJwtProvider·CfAuthController·
 * CfTokenAuthFilter·cf_client 테이블)는 그대로 남겨뒀다 — 나중에 EcAdminApi 의 CfCdnApiClient 를
 * 실제로 연동할 때(현재는 대기 상태) 서버-서버 호출 구간만 다시 강제하고 싶어질 수 있어서다.
 * 지금은 {@code /api/cdn/**} 를 permitAll 로 열어뒀기 때문에 그 체계가 실질적으로는 켜져 있어도
 * 아무 경로에서도 강제되지 않는다(요청 시 토큰을 보내도 무시될 뿐 — 있어도 없어도 통과).</p>
 */
@Slf4j
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CfTokenAuthFilter cfTokenAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(AbstractHttpConfigurer::disable) // 서버-서버 호출 + <img>/<video> 직접 로드만 있어 CORS 불필요
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/actuator/**").permitAll()
                .requestMatchers("/api/auth/login", "/api/auth/refresh").permitAll()
                .requestMatchers("/cf/file/**", "/cf/thumbnail/**", "/cf/frame/**", "/cf/stream/**").permitAll()
                // 관리 화면 정적 리소스. "/" 단독(파일명 없음)도 필요 — Spring Boot 의 "루트 요청엔
                // index.html 서빙" 처리는 정적 리소스 핸들러 단계라, 그 전에 걸리는 이 보안필터는
                // "/" 자체를 "/*.html" 로 안 봐서 안 넣으면 여기서 먼저 401 난다(nginx 의
                // /cdn-admin/ → / 리라이트로 실제로 겪음, 2026-09-06).
                .requestMatchers(HttpMethod.GET, "/", "/*.html", "/css/**", "/js/**", "/favicon.ico").permitAll()
                // 관리 화면(cf_client/cf_file CRUD, 업로드/삭제)은 로그인 없이 사용 — 요청사항.
                .requestMatchers("/api/cdn/**").permitAll()
                .anyRequest().authenticated()
            )
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, e) -> {
                    log.warn("[SecurityConfig] Unauthorized [401]: {} | uri={}", e.getMessage(), request.getRequestURI());
                    response.setStatus(401);
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setCharacterEncoding(StandardCharsets.UTF_8.name());
                    response.getWriter().write("{\"ok\":false,\"status\":401,\"message\":\"accessToken 이 없거나 만료되었습니다.\"}");
                })
            )
            .addFilterBefore(cfTokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
