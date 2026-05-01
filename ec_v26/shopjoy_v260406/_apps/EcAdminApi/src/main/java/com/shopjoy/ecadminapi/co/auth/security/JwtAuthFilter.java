package com.shopjoy.ecadminapi.co.auth.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.shopjoy.ecadminapi.common.log.AccessLogFilter;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.MDC;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;

/**
 * JWT 인증 필터.
 *
 * 기존 UserDetailsService.loadUserByUsername() 방식 대비 개선점:
 * - 매 요청마다 DB를 조회하지 않고 JWT 클레임(userId, userType, roles)만으로 AuthPrincipal을 구성한다.
 * - 두 사용자 테이블(sy_user / ec_member)을 단일 필터에서 처리할 수 있다.
 *   userType 클레임 값으로 어느 테이블 사용자인지 구분하며, 필터는 테이블을 알 필요가 없다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        try {
            // 요청 정보 MDC — 인증 여부와 무관하게 항상 기록
            String method = request.getMethod();
            String host   = request.getHeader("Host");
            if (host == null) host = request.getServerName();
            String path   = request.getRequestURI();
            String query  = request.getQueryString();
            String ip     = resolveClientIp(request);
            String ua     = request.getHeader("User-Agent");

            MDC.put("reqMethod",  method);
            MDC.put("reqHost",    host);
            MDC.put("reqPath",    path);
            MDC.put("reqQuery",   query != null ? query : "");
            MDC.put("reqIp",      ip);
            MDC.put("reqUa",      ua != null && ua.length() > 200 ? ua.substring(0, 200) : (ua != null ? ua : ""));
            MDC.put("req",        method + " " + host + path);  // logback 패턴 표시용
            MDC.put("reqStartMs", String.valueOf(System.currentTimeMillis()));  // 경과 시간 계산용

            // 화면명·작업명 MDC (프론트에서 X-UI-Nm / X-Cmd-Nm 헤더로 전달)
            String uiNm  = request.getHeader("X-UI-Nm");
            String cmdNm = request.getHeader("X-Cmd-Nm");
            MDC.put("uiNm",  uiNm  != null ? uiNm  : "");
            MDC.put("cmdNm", cmdNm != null ? cmdNm : "");

            String token = extractToken(request);

            if (StringUtils.hasText(token) && jwtProvider.validate(token)) {
                String tokenType = jwtProvider.getTokenType(token);
                if ("access".equals(tokenType)) {
                    try {
                        Claims claims     = jwtProvider.getClaims(token);
                        String authId     = claims.getSubject();        // authId: BO=user_id, FO=member_id
                        String userTypeCd = claims.get("userTypeCd", String.class);
                        String siteId     = claims.get("siteId",     String.class);
                        String roleId     = claims.get("roleId",     String.class);
                        String deptId     = claims.get("deptId",     String.class);
                        String vendorId   = claims.get("vendorId",   String.class);
                        String userNm     = claims.get("userNm",     String.class);
                        String accessToken  = claims.get("accessToken",  String.class);
                        String refreshToken = claims.get("refreshToken", String.class);
                        String userId     = claims.get("userId",     String.class); // BO 전용
                        String memberId   = claims.get("memberId",   String.class); // FO 전용
                        String memberGrade  = claims.get("memberGrade",  String.class);
                        String isAdminYn  = claims.get("isAdminYn",  String.class);
                        String isStaffYn  = claims.get("isStaffYn",  String.class);

                        @SuppressWarnings("unchecked")
                        List<String> roles = claims.get("roles", List.class);

                        AuthPrincipal principal = new AuthPrincipal(
                                authId,                                 // authId
                                userTypeCd,                             // userTypeCd
                                LocalDateTime.now(),                    // loginTime
                                CmUtil.nvl(roleId),                     // roleId
                                CmUtil.nvl(userNm),                     // userNm
                                CmUtil.nvl(accessToken),                // accessToken
                                CmUtil.nvl(refreshToken),               // refreshToken
                                CmUtil.nvl(siteId),                     // siteId
                                CmUtil.nvl(deptId),                     // deptId
                                CmUtil.nvlList(roles),                  // roles
                                CmUtil.nvl(userId),                     // userId  (BO 전용)
                                CmUtil.nvl(memberId),                   // memberId (FO 전용)
                                CmUtil.nvl(vendorId),                   // vendorId
                                CmUtil.nvl(memberGrade),                // memberGrade
                                CmUtil.nvl(isAdminYn, "N"),             // isAdminYn
                                CmUtil.nvl(isStaffYn, "N")              // isStaffYn
                        );

                        List<SimpleGrantedAuthority> grantedAuthorities = roles == null ? List.of() :
                            roles.stream().map(SimpleGrantedAuthority::new).toList();

                        UsernamePasswordAuthenticationToken auth =
                            new UsernamePasswordAuthenticationToken(principal, null, grantedAuthorities);
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);

                        // MDC — 로그에 인증 사용자 정보 삽입
                        MDC.put("siteId",   CmUtil.nvl(siteId, "-"));
                        MDC.put("authId",   authId);
                        MDC.put("userTypeCd", CmUtil.nvl(userTypeCd, "-"));
                        MDC.put("roleId",   CmUtil.nvl(roleId, "-"));
                        MDC.put("deptId",   CmUtil.nvl(deptId, "-"));
                        MDC.put("vendorId", CmUtil.nvl(vendorId, "-"));
                        // request attribute — AccessLogFilter 가 체인 종료 후 읽음 (MDC는 finally 에서 clear)
                        request.setAttribute(AccessLogFilter.ATTR_USER_ID,   authId);
                        request.setAttribute(AccessLogFilter.ATTR_USER_TYPE_CD, CmUtil.nvl(userTypeCd, "-"));
                        request.setAttribute(AccessLogFilter.ATTR_ROLE_ID,   CmUtil.nvl(roleId, "-"));
                        request.setAttribute(AccessLogFilter.ATTR_DEPT_ID,   deptId);
                        request.setAttribute(AccessLogFilter.ATTR_VENDOR_ID, vendorId);

                    } catch (Exception e) {
                        log.warn("Failed to build principal from token: {}", e.getMessage());
                        mdcAnonymous(request);
                    }
                } else {
                    mdcAnonymous(request);
                }
            } else {
                mdcAnonymous(request);
            }

            filterChain.doFilter(request, response);

        } finally {
            MDC.clear();  // 요청 종료 후 반드시 MDC 초기화 (스레드 풀 재사용 오염 방지)
        }
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

    private static void mdcAnonymous(HttpServletRequest request) {
        MDC.put("siteId",   "-");
        MDC.put("authId",   "-");
        MDC.put("userTypeCd", "-");
        MDC.put("roleId",   "-");
        MDC.put("deptId",   "-");
        MDC.put("vendorId", "-");
        request.setAttribute(AccessLogFilter.ATTR_USER_ID,   "-");
        request.setAttribute(AccessLogFilter.ATTR_USER_TYPE_CD, "-");
        request.setAttribute(AccessLogFilter.ATTR_ROLE_ID,   "-");
        request.setAttribute(AccessLogFilter.ATTR_DEPT_ID,   null);
        request.setAttribute(AccessLogFilter.ATTR_VENDOR_ID, null);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
