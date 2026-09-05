package com.shopjoy.ecBeBo.common.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * CORS 진단 로깅 필터 — 2026-08-30 추가.
 *
 * <p>브라우저의 실제 CORS 거부(특히 preflight)는 Spring Security 의 {@code CorsFilter} 가
 * 필터 단계에서 예외 없이 바로 403 "Invalid CORS request" 를 응답해버려서, 그 뒤에 있는
 * {@link com.shopjoy.ecBeBo.common.exception.GlobalExceptionHandler} 까지 애초에
 * 도달하지 않는다(실측 확인함). 게다가 그 응답 body 를 커스터마이즈해도 브라우저가 CORS
 * 위반 응답 자체를 JS 에서 못 읽게 막아버려서 프론트 개발자한텐 어차피 안 보인다 —
 * 그래서 <b>응답을 건드리지 않고</b>(CorsFilter 의 실제 판정/응답 로직은 그대로 두고)
 * 서버 콘솔 로그로만 "이 Origin 은 허용 목록에 없다"를 알려준다. 백엔드를 띄운 사람이
 * 콘솔을 보고 있으면 프론트보다 오히려 더 빨리, 확실하게 확인할 수 있다.</p>
 *
 * <p>SecurityConfig 에서 {@code addFilterBefore(this, CorsFilter.class)} 로 Spring Security 의
 * CorsFilter 바로 앞에 끼워 넣는다 — CORS 판정 자체는 절대 안 건드리고 그냥 지나가는 요청을
 * 관찰만 하므로(항상 {@code chain.doFilter()} 호출), 실제 CORS 허용/차단 동작에 영향이 없다.</p>
 *
 * <p>prod 프로파일에서는 아무 것도 안 한다 — 허용 목록 자체를 로그에라도 노출할 이유가 없다.</p>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CorsHintLoggingFilter extends OncePerRequestFilter {

    private final Environment environment;

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        if (!environment.matchesProfiles("prod")) {
            String origin = req.getHeader("Origin");
            if (origin != null && !origin.isBlank() && !isOriginAllowed(origin)) {
                log.warn("[CORS 힌트] Origin '{}' 이(가) 허용 목록에 없습니다 ({} {}) — 허용된 Origin 패턴: {}",
                    origin, req.getMethod(), req.getRequestURI(),
                    String.join(", ", CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS));
            }
        }
        chain.doFilter(req, res);
    }

    /** {@link CorsOriginPolicy#ALLOWED_ORIGIN_PATTERNS} 와 동일한 단순 매칭 로직
        (GlobalExceptionHandler 의 동명 메서드와 같은 판정 기준 — 판정 자체를 대신하지 않는
        진단용 근사치라는 점도 동일). 실제 판정은 Spring Security 의 CorsFilter(AntPathMatcher
        기반)가 하므로, 여기 로직은 그 결과를 "대략" 미리 알려주는 용도일 뿐이다. */
    private boolean isOriginAllowed(String origin) {
        for (String pattern : CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS) {
            if (pattern.endsWith(":*")) {
                // "https://host:*" — 포트만 와일드카드
                if (origin.startsWith(pattern.substring(0, pattern.length() - 1))) return true;
            } else if (pattern.contains("://*.")) {
                // "https://*.domain" — 서브도메인 와일드카드 (2026-09-05: 21000.illeesam.synology.me 등)
                int schemeEnd = pattern.indexOf("://*.") + 3; // "://" 뒤 위치
                String scheme = pattern.substring(0, schemeEnd);      // 예: "https://"
                String suffix = pattern.substring(schemeEnd + 1);     // 예: "*." 제거 → ".illeesam.synology.me"
                if (origin.startsWith(scheme) && origin.endsWith(suffix) && origin.length() > scheme.length() + suffix.length()) {
                    return true;
                }
            } else if (pattern.equals(origin)) {
                return true;
            }
        }
        return false;
    }
}
