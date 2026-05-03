package com.shopjoy.ecadminapi.common.license;

import com.shopjoy.ecadminapi.common.license.exception.LicenseException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Set;

/**
 * 라이선스 검증 필터.
 *
 * ── 검증 흐름 ────────────────────────────────────────────────────
 *
 * 클라이언트 요청 (boApiAxios / foApiAxios)
 *   Headers:
 *     X-License-Code: eyJ...base64....서명16자
 *     X-Site-Id:      SITE_BO_01
 *          │
 *          ▼
 * LicenseFilter.doFilterInternal()
 *          │
 *          ├─ 1) 헤더 존재 확인
 *          │      X-License-Code 없음 → LicenseException(NO_HEADER) → 403
 *          │
 *          ├─ 2) 형식 확인 (LicenseUtil.verify)
 *          │      "." 으로 split → [Base64부분, 서명부분] 2개여야 함
 *          │      형식 틀리면 → LicenseException(INVALID_FORMAT) → 403
 *          │
 *          ├─ 3) 서명 검증
 *          │      HMAC-SHA256(secret, Base64부분) 앞 16자 == 서명부분?
 *          │      불일치 → LicenseException(INVALID_SIGNATURE) → 403
 *          │      (secret 없이는 서명 위조 불가)
 *          │
 *          ├─ 4) siteId 일치 확인
 *          │      payload 안의 siteId == X-Site-Id 헤더값?
 *          │      불일치 → LicenseException(SITE_MISMATCH) → 403
 *          │      (다른 사이트 라이선스 재사용 차단)
 *          │
 *          ├─ 5) 만료일 확인
 *          │      payload 안의 expireDate >= 오늘?
 *          │      만료됨 → LicenseException(EXPIRED) → 403
 *          │
 *          └─ 모두 통과 → chain.doFilter() → 다음 필터/컨트롤러 진행
 *
 * ── 검증 제외 경로 ────────────────────────────────────────────────
 *   /api/co/bo-auth/**         BO 로그인 API (라이선스 로드 전 호출)
 *   /api/co/fo-auth/**         FO 로그인 API (라이선스 로드 전 호출)
 *   /api/co/cm/fo-app-store/** FO 초기화 데이터
 *   /api/co/cm/bo-app-store/** BO 초기화 데이터
 *   /actuator/**               헬스체크
 *   OPTIONS                    CORS preflight
 *   app.license.enabled=false  전체 비활성 (local 개발 편의)
 *
 * ── 보안 포인트 ───────────────────────────────────────────────────
 *   헤더 없이 호출       → NO_HEADER       → 403
 *   임의로 만든 코드     → INVALID_SIGNATURE → 403 (secret 없이 서명 불가)
 *   타 사이트 라이선스   → SITE_MISMATCH   → 403
 *   만료된 라이선스      → EXPIRED         → 403
 *
 * ── 헤더 출처 ─────────────────────────────────────────────────────
 *   X-License-Code : boApiAxios / foApiAxios request interceptor 자동 주입
 *                    (window.SHOPJOY_LICENSE_BO / SHOPJOY_LICENSE_FO 참조)
 *   X-Site-Id      : 동일 라이선스 객체의 siteId 값
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LicenseFilter extends OncePerRequestFilter {

    @Value("${app.license.secret}")
    private String secret;

    @Value("${app.license.enabled:true}")
    private boolean enabled;

    @Autowired
    private Environment environment;

    /* 검증 제외 경로 prefix */
    private static final Set<String> SKIP_PREFIXES = Set.of(
        "/api/co/bo-auth",
        "/api/co/fo-auth",
        "/api/co/cm/fo-app-store",
        "/api/co/cm/bo-app-store",
        "/actuator"
    );

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        if (!enabled) return true;
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
        String uri = request.getRequestURI();
        return SKIP_PREFIXES.stream().anyMatch(uri::startsWith);
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        String licenseCode = request.getHeader("X-License-Code");
        String buyerId     = request.getHeader("X-Buyer-Id");

        // MDC 기본 요청 정보 설정 (JwtAuthFilter보다 먼저 실행되므로 직접 세팅)
        String method = request.getMethod();
        String host   = request.getHeader("Host");
        if (host == null) host = request.getServerName();
        String path   = request.getRequestURI();
        String query  = request.getQueryString();
        String ip     = resolveClientIp(request);
        MDC.put("reqMethod", method);
        MDC.put("reqHost",   host);
        MDC.put("reqPath",   path);
        MDC.put("reqQuery",  query != null ? query : "");
        MDC.put("reqIp",     ip);
        MDC.put("reqStartMs", String.valueOf(System.currentTimeMillis()));

        try {
            LicensePayload payload = LicenseUtil.verify(secret, licenseCode, buyerId);
            printReportIfLocal(request, payload, buyerId);
            chain.doFilter(request, response);
        } catch (LicenseException e) {
            log.error("[LicenseFilter] 라이선스 검증 실패: {} - {} | uri={} ip={} buyerId={}",
                e.getReason(), e.getMessage(), path, ip, buyerId);
            sendError(response, e);
        }
    }

    /** local 프로파일 + getInitData 요청 시 라이선스 payload 리포트 출력 */
    private void printReportIfLocal(HttpServletRequest request, LicensePayload payload, String buyerId) {
        boolean isLocal = Arrays.asList(environment.getActiveProfiles()).contains("local");
        if (!isLocal) return;

        String uri = request.getRequestURI();
        if (!uri.contains("getInitData")) return;

        String line = "─".repeat(60);
        log.info("\n  ┌{}\n  │ [LicenseFilter] getInitData 라이선스 리포트\n  ├{}", line, line);
        log.info("  │  URI       : {}", uri);
        log.info("  │  siteType  : {}", payload.getSiteType());
        log.info("  │  siteId    : {}", payload.getSiteId());
        log.info("  │  siteNo    : {}", payload.getSiteNo());
        log.info("  │  buyerId   : {}  ← [필터검증] X-Buyer-Id 헤더값={}", payload.getBuyerId(), buyerId);
        log.info("  │  expireDate: {}", payload.getExpireDate());
        log.info("  │  서명      : ✅ OK  (HMAC-SHA256)");
        log.info("  └{}", line);
    }

    private static String resolveClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();
        if (ip != null && ip.contains(","))
            ip = ip.split(",")[0].trim();
        return ip != null ? ip : "-";
    }

    private void sendError(HttpServletResponse response, LicenseException e) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        String body = "{\"status\":403,\"message\":\"" + e.getMessage() + "\",\"reason\":\"" + e.getReason() + "\"}";
        response.getWriter().write(body);
    }
}
