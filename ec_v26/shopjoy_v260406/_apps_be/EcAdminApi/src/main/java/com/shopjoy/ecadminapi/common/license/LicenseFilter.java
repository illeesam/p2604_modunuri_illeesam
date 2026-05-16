//package com.shopjoy.ecadminapi.common.license;
//
//import com.shopjoy.ecadminapi.common.license.exception.LicenseException;
//import jakarta.servlet.FilterChain;
//import jakarta.servlet.ServletException;
//import jakarta.servlet.http.HttpServletRequest;
//import jakarta.servlet.http.HttpServletResponse;
//import lombok.NonNull;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.slf4j.MDC;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.core.env.Environment;
//import org.springframework.http.MediaType;
//import org.springframework.stereotype.Component;
//import org.springframework.web.filter.OncePerRequestFilter;
//
//import java.io.IOException;
//import java.nio.charset.StandardCharsets;
//import java.util.Arrays;
//import java.util.Set;
//
///**
// * 라이선스 검증 필터.
// *
// * ── 검증 흐름 ────────────────────────────────────────────────────
// *
// * 클라이언트 요청 (boApiAxios / foApiAxios)
// *   Headers:
// *     X-License-Code: eyJ...base64....서명16자
// *     X-Site-Id:      SITE_BO_01
// *          │
// *          ▼
// * LicenseFilter.doFilterInternal()
// *          │
// *          ├─ 1) 헤더 존재 확인
// *          │      X-License-Code 없음 → LicenseException(NO_HEADER) → 403
// *          │
// *          ├─ 2) 형식 확인 (LicenseUtil.verify)
// *          │      "." 으로 split → [Base64부분, 서명부분] 2개여야 함
// *          │      형식 틀리면 → LicenseException(INVALID_FORMAT) → 403
// *          │
// *          ├─ 3) 서명 검증
// *          │      HMAC-SHA256(secret, Base64부분) 앞 16자 == 서명부분?
// *          │      불일치 → LicenseException(INVALID_SIGNATURE) → 403
// *          │      (secret 없이는 서명 위조 불가)
// *          │
// *          ├─ 4) siteId 일치 확인
// *          │      payload 안의 siteId == X-Site-Id 헤더값?
// *          │      불일치 → LicenseException(SITE_MISMATCH) → 403
// *          │      (다른 사이트 라이선스 재사용 차단)
// *          │
// *          ├─ 5) 만료일 확인
// *          │      payload 안의 expireDate >= 오늘?
// *          │      만료됨 → LicenseException(EXPIRED) → 403
// *          │
// *          └─ 모두 통과 → chain.doFilter() → 다음 필터/컨트롤러 진행
// *
// * ── 검증 제외 경로 ────────────────────────────────────────────────
// *   /api/co/bo-auth/**         BO 로그인 API (라이선스 로드 전 호출)
// *   /api/co/fo-auth/**         FO 로그인 API (라이선스 로드 전 호출)
// *   /api/co/cm/fo-app-store/** FO 초기화 데이터
// *   /api/co/cm/bo-app-store/** BO 초기화 데이터
// *   /actuator/**               헬스체크
// *   OPTIONS                    CORS preflight
// *   app.license.enabled=false  전체 비활성 (local 개발 편의)
// *
// * ── 보안 포인트 ───────────────────────────────────────────────────
// *   헤더 없이 호출       → NO_HEADER       → 403
// *   임의로 만든 코드     → INVALID_SIGNATURE → 403 (secret 없이 서명 불가)
// *   타 사이트 라이선스   → SITE_MISMATCH   → 403
// *   만료된 라이선스      → EXPIRED         → 403
// *
// * ── 헤더 출처 ─────────────────────────────────────────────────────
// *   X-License-Code : boApiAxios / foApiAxios request interceptor 자동 주입
// *                    (window.SHOPJOY_LICENSE_BO / SHOPJOY_LICENSE_FO 참조)
// *   X-Site-Id      : 동일 라이선스 객체의 siteId 값
// */
//@Slf4j
//@Component
//@RequiredArgsConstructor
//public class LicenseFilter extends OncePerRequestFilter {
//
//    @Value("${app.license.secret}")
//    private String secret;
//
//    @Value("${app.license.enabled:true}")
//    private boolean enabled;
//
//    @Autowired
//    private Environment environment;
//
//    /* 검증 제외 경로 prefix */
//    private static final Set<String> SKIP_PREFIXES = Set.of(
//        "/api/co/bo-auth",
//        "/api/co/fo-auth",
//        "/api/co/cm/fo-app-store",
//        "/api/co/cm/bo-app-store",
//        "/actuator"
//    );
//
//    /**
//     * 이 요청을 라이선스 검증에서 제외할지 판단한다.
//     *
//     * <p>제외 조건(하나라도 해당 시 검증 스킵):
//     * <ul>
//     *   <li>{@code app.license.enabled=false} — 전체 비활성(local 개발 편의)</li>
//     *   <li>HTTP OPTIONS — CORS preflight 는 라이선스 헤더가 없음</li>
//     *   <li>URI 가 {@link #SKIP_PREFIXES} 중 하나로 시작 — 로그인/초기화 데이터
//     *       API 는 라이선스 로드 이전에 호출되므로 검증 대상에서 제외</li>
//     * </ul></p>
//     *
//     * @param request 현재 요청
//     * @return 검증 제외 대상이면 {@code true}
//     */
//    @Override
//    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
//        if (!enabled) return true;
//        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) return true;
//        String uri = request.getRequestURI();
//        return SKIP_PREFIXES.stream().anyMatch(uri::startsWith);
//    }
//
//    /**
//     * 요청별 라이선스 검증 본체.
//     *
//     * <p>동작 순서와 각 단계 의도:
//     * <ol>
//     *   <li><b>헤더 추출</b> — {@code X-License-Code}(코드), {@code X-Buyer-Id}
//     *       (소유자). boApiAxios/foApiAxios interceptor 가 자동 주입한다.</li>
//     *   <li><b>MDC 세팅</b> — 본 필터가 JwtAuthFilter 보다 먼저 실행되므로 요청
//     *       메서드/호스트/경로/IP/시작시각을 직접 MDC 에 넣어 이후 로그 상관관계를
//     *       확보한다.</li>
//     *   <li><b>검증</b> — {@link LicenseUtil#verify} 가 토큰 파싱 → 서명 검증 →
//     *       siteId/buyerId 일치 → 만료를 순서대로 검사한다. 통과 시
//     *       {@code chain.doFilter} 로 다음 필터/컨트롤러 진행.</li>
//     *   <li><b>실패</b> — {@link LicenseException} 을 잡아 사유를 error 로그로
//     *       남기고 {@link #sendError} 로 403 JSON 응답 후 체인 중단(다음 단계로
//     *       진행하지 않음 → 보호 자원 접근 차단).</li>
//     * </ol></p>
//     *
//     * @param request  현재 요청
//     * @param response 응답(검증 실패 시 403 본문 작성)
//     * @param chain    다음 필터 체인(검증 통과 시에만 진행)
//     * @throws ServletException 체인 처리 중 서블릿 예외
//     * @throws IOException      응답 쓰기/체인 I/O 예외
//     */
//    @Override
//    protected void doFilterInternal(@NonNull HttpServletRequest request,
//                                    @NonNull HttpServletResponse response,
//                                    @NonNull FilterChain chain) throws ServletException, IOException {
//        String licenseCode = request.getHeader("X-License-Code");
//        String buyerId     = request.getHeader("X-Buyer-Id");
//
//        // MDC 기본 요청 정보 설정 (JwtAuthFilter보다 먼저 실행되므로 직접 세팅)
//        String method = request.getMethod();
//        String host   = request.getHeader("Host");
//        if (host == null) host = request.getServerName();
//        String path   = request.getRequestURI();
//        String query  = request.getQueryString();
//        String ip     = resolveClientIp(request);
//        MDC.put("reqMethod", method);
//        MDC.put("reqHost",   host);
//        MDC.put("reqPath",   path);
//        MDC.put("reqQuery",  query != null ? query : "");
//        MDC.put("reqIp",     ip);
//        MDC.put("reqStartMs", String.valueOf(System.currentTimeMillis()));
//
//        try {
//            LicensePayload payload = LicenseUtil.verify(secret, licenseCode, buyerId);
//            printReportIfLocal(request, payload, buyerId);
//            chain.doFilter(request, response);
//        } catch (LicenseException e) {
//            log.error("[LicenseFilter] 라이선스 검증 실패: {} - {} | uri={} ip={} buyerId={}",
//                e.getReason(), e.getMessage(), path, ip, buyerId);
//            sendError(response, e);
//        }
//    }
//
//    /**
//     * local 프로파일 + getInitData 요청에 한해 검증된 payload 리포트를 로그로 출력.
//     *
//     * <p>운영/개발 환경에서는 즉시 반환(no-op)하여 로그 노이즈와 정보 노출을
//     * 막는다. local + URI 에 {@code getInitData} 포함 시에만 siteType/siteId/
//     * siteNo/buyerId/expireDate 와 헤더로 받은 buyerId 대조 결과를 가독성 있는
//     * 박스 형태로 남긴다(개발자 확인용).</p>
//     *
//     * @param request 현재 요청(URI 판정용)
//     * @param payload 검증을 통과한 라이선스 payload
//     * @param buyerId 헤더 {@code X-Buyer-Id} 원본값(payload 와 대조 표시)
//     */
//    /** local 프로파일 + getInitData 요청 시 라이선스 payload 리포트 출력 */
//    private void printReportIfLocal(HttpServletRequest request, LicensePayload payload, String buyerId) {
//        boolean isLocal = Arrays.asList(environment.getActiveProfiles()).contains("local");
//        if (!isLocal) return;
//
//        String uri = request.getRequestURI();
//        if (!uri.contains("getInitData")) return;
//
//        String line = "─".repeat(60);
//        log.info("\n  ┌{}\n  │ [LicenseFilter] getInitData 라이선스 리포트\n  ├{}", line, line);
//        log.info("  │  URI       : {}", uri);
//        log.info("  │  siteType  : {}", payload.getSiteType());
//        log.info("  │  siteId    : {}", payload.getSiteId());
//        log.info("  │  siteNo    : {}", payload.getSiteNo());
//        log.info("  │  buyerId   : {}  ← [필터검증] X-Buyer-Id 헤더값={}", payload.getBuyerId(), buyerId);
//        log.info("  │  expireDate: {}", payload.getExpireDate());
//        log.info("  │  서명      : ✅ OK  (HMAC-SHA256)");
//        log.info("  └{}", line);
//    }
//
//    /**
//     * 프록시 환경을 고려해 클라이언트 실제 IP 를 해석한다.
//     *
//     * <p>{@code X-Forwarded-For} → {@code X-Real-IP} → {@code getRemoteAddr()}
//     * 순으로 조회하며, 비어있거나 {@code "unknown"} 이면 다음 후보로 넘어간다.
//     * XFF 가 다중 홉(쉼표 구분)인 경우 첫 번째(원 클라이언트) 항목을 사용한다.
//     * 끝내 못 구하면 {@code "-"} 를 반환(로그 안정성 보장).</p>
//     *
//     * @param request 현재 요청
//     * @return 클라이언트 IP 또는 {@code "-"}
//     */
//    private static String resolveClientIp(HttpServletRequest request) {
//        String ip = request.getHeader("X-Forwarded-For");
//        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
//            ip = request.getHeader("X-Real-IP");
//        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
//            ip = request.getRemoteAddr();
//        if (ip != null && ip.contains(","))
//            ip = ip.split(",")[0].trim();
//        return ip != null ? ip : "-";
//    }
//
//    /**
//     * 라이선스 검증 실패 시 403 JSON 오류 응답을 작성한다.
//     *
//     * <p>상태 403(FORBIDDEN) + UTF-8 JSON 으로 {@code status/message/reason} 을
//     * 내려준다. {@code reason} 은 {@link LicenseException.Reason} 이며 클라이언트가
//     * 실패 유형(서명/만료/사이트불일치 등)을 식별하는 데 사용한다. 메시지에
//     * expected/actual 값이 포함될 수 있어 노출 범위에 유의한다.</p>
//     *
//     * @param response 응답 객체
//     * @param e        발생한 라이선스 예외
//     * @throws IOException 응답 본문 쓰기 실패 시
//     */
//    private void sendError(HttpServletResponse response, LicenseException e) throws IOException {
//        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
//        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
//        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
//        String body = "{\"status\":403,\"message\":\"" + e.getMessage() + "\",\"reason\":\"" + e.getReason() + "\"}";
//        response.getWriter().write(body);
//    }
//}
