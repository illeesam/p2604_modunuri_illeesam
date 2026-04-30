package com.shopjoy.ecadminapi.common.log;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * API 응답 헤더에 X- 정보를 추가하는 필터
 * - X-File-Nm, X-Func-Nm, X-Line-No: 요청 헤더에서 수집 후 응답 헤더에 포함
 * - X-Trace-Id: 요청 헤더에서 수집
 * - X-User-Id, X-Site-Id, X-Site-No, X-License-No: request attribute에서 수집
 * - X-User-Agent: User-Agent 헤더에서 수집
 */
public class ApiResponseHeaderFilter extends OncePerRequestFilter {

    private static final DateTimeFormatter TRACE_FMT = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss");

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
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

    private String getHeader(HttpServletRequest request, String name) {
        String value = request.getHeader(name);
        return value != null ? value : "";
    }

    private String getAttr(HttpServletRequest request, String name) {
        Object value = request.getAttribute(name);
        return value instanceof String ? (String) value : "";
    }

    private boolean isEmpty(String value) {
        return value == null || value.trim().isEmpty();
    }
}
