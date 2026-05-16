package com.shopjoy.ecadminapi.common.log;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.format.DateTimeFormatter;

/**
 * API 응답 헤더에 X- 정보를 추가하는 필터
 * - X-File-Nm, X-Func-Nm, X-Line-No: 요청 헤더에서 수집 후 응답 헤더에 포함
 * - X-Trace-Id: 요청 헤더에서 수집
 * - X-User-Id, X-Site-Id, X-Site-No, X-License-No: request attribute에서 수집
 * - X-User-Agent: User-Agent 헤더에서 수집
 */
public class ApiResponseHeaderFilter extends OncePerRequestFilter {

    /** 추적 ID 생성용 타임스탬프 포맷 (yyyyMMdd_HHmmss) */
    private static final DateTimeFormatter TRACE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    /** CORS preflight (OPTIONS) 는 응답 헤더 추가 불필요 — 필터 자체 skip */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    /**
     * 요청 헤더·request attribute 의 추적/사용자/사이트 정보를 응답 헤더로 되돌려준다.
     *
     * <p>요청 헤더의 X-File-Nm/X-Func-Nm/X-Line-No/X-Trace-Id/User-Agent 를 그대로
     * 응답 헤더에 echo 하고, AccessLogFilter 이후 단계에서 request attribute 에 채워진
     * _authUserId/_selectedSiteId/_selectedSiteNo/_licenseNo 를 X- 헤더로 노출한다.
     * 빈 값은 헤더를 설정하지 않는다.
     *
     * <p>엣지케이스: 응답이 이미 커밋된 경우 등 헤더 설정 실패는 본 요청 처리에 영향을
     * 주지 않도록 catch 하여 경고 로그만 남기고 체인을 계속 진행한다.
     *
     * @param request  HTTP 요청
     * @param response HTTP 응답
     * @param chain    이후 필터 체인
     * @throws ServletException 체인 처리 중 서블릿 예외
     * @throws IOException      체인 처리 중 입출력 예외
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
        try {
            // 요청 헤더에서 X- 정보 수집
            String fileNm = getHeader(request, "X-File-Nm");
            String funcNm = getHeader(request, "X-Func-Nm");
            String lineNo = getHeader(request, "X-Line-No");
            String traceId = getHeader(request, "X-Trace-Id");
            String userAgent = getHeader(request, "User-Agent");

            // 응답 헤더에 추가
            if (!isEmpty(fileNm)) {
                response.setHeader("X-File-Nm", fileNm);
            }
            if (!isEmpty(funcNm)) {
                response.setHeader("X-Func-Nm", funcNm);
            }
            if (!isEmpty(lineNo)) {
                response.setHeader("X-Line-No", lineNo);
            }
            if (!isEmpty(traceId)) {
                response.setHeader("X-Trace-Id", traceId);
            }
            if (!isEmpty(userAgent)) {
                response.setHeader("X-User-Agent", userAgent);
            }

            // request attribute에서 사용자 정보 수집 (AccessLogFilter 이후 사용)
            String userId = getAttr(request, "_authUserId");
            if (!isEmpty(userId)) {
                response.setHeader("X-User-Id", userId);
            }

            // 사이트 정보 추가 (관리자 선택 사이트)
            String siteId = getAttr(request, "_selectedSiteId");
            if (!isEmpty(siteId)) {
                response.setHeader("X-Site-Id", siteId);
            }

            String siteNo = getAttr(request, "_selectedSiteNo");
            if (!isEmpty(siteNo)) {
                response.setHeader("X-Site-No", siteNo);
            }

            // 라이센스 정보 추가
            String licenseNo = getAttr(request, "_licenseNo");
            if (!isEmpty(licenseNo)) {
                response.setHeader("X-License-No", licenseNo);
            }

        } catch (Exception e) {
            // 헤더 추가 실패는 무시하고 계속 진행
            logger.warn("[ApiResponseHeaderFilter] Failed to set response headers: " + e.getMessage());
        }

        chain.doFilter(request, response);
    }

    /**
     * 요청 헤더 값을 null 안전하게 조회한다.
     *
     * @param request 요청
     * @param name    헤더명
     * @return 헤더 값, 없으면 빈 문자열
     */
    private String getHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value != null ? value : "";
    }

    /**
     * request attribute 값을 String 으로 null 안전하게 조회한다.
     *
     * @param request 요청
     * @param name    attribute 키
     * @return String 값, 없거나 String 이 아니면 빈 문자열
     */
    private String getAttr(HttpServletRequest request, String name) {
        Object value = request.getAttribute(name);
        return value instanceof String ? (String) value : "";
    }

    /**
     * 헤더 설정 생략 판단용 공백 검사.
     *
     * @param value 검사 대상
     * @return null 이거나 trim 후 비어 있으면 true
     */
    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
