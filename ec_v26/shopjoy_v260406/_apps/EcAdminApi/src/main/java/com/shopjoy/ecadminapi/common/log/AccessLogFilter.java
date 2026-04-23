package com.shopjoy.ecadminapi.common.log;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessLog;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.TimeUnit;

/**
 * API 요청/응답 액세스 로그 필터.
 *
 * - Spring Security(JwtAuthFilter)보다 먼저 실행되어 전체 체인을 감싼다.
 * - 체인 완료 후 request attribute (_authUserId, _authUserType, _authRoleId) 로 인증 정보 수집.
 *   (JwtAuthFilter 가 MDC를 finally 에서 clear 하므로 request attribute 방식 사용)
 * - AccessLogProperties.isMatch() 조건 통과 시에만 큐에 적재.
 */
public class AccessLogFilter extends OncePerRequestFilter {

    /** JwtAuthFilter 가 request attribute 에 설정하는 키 */
    public static final String ATTR_USER_ID   = "_authUserId";
    public static final String ATTR_USER_TYPE_CD = "_authUserTypeCd";
    public static final String ATTR_ROLE_ID   = "_authRoleId";
    public static final String ATTR_DEPT_ID   = "_authDeptId";
    public static final String ATTR_VENDOR_ID = "_authVendorId";

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final AccessLogQueue      queue;
    private final AccessLogProperties props;
    private final String              serverNm;
    private final String              activeProfile;

    public AccessLogFilter(AccessLogQueue queue, AccessLogProperties props,
                           String serverNm, String activeProfile) {
        this.queue         = queue;
        this.props         = props;
        this.serverNm      = serverNm;
        this.activeProfile = activeProfile;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        boolean captureBody = props.getMaxBodySize() > 0;
        ContentCachingRequestWrapper  reqWrap  = captureBody
                ? new ContentCachingRequestWrapper(request,  props.getMaxBodySize())
                : null;
        ContentCachingResponseWrapper respWrap = captureBody
                ? new ContentCachingResponseWrapper(response)
                : null;

        LocalDateTime reqDt  = LocalDateTime.now();
        long          startNs = System.nanoTime();

        try {
            chain.doFilter(reqWrap != null ? reqWrap : request,
                           respWrap != null ? respWrap : response);
        } finally {
            try {
                long elapsedMs = TimeUnit.NANOSECONDS.toMillis(System.nanoTime() - startNs);

                String userId   = attr(request, ATTR_USER_ID,   "-");
                String userTypeCd = attr(request, ATTR_USER_TYPE_CD, "-");
                String roleId   = attr(request, ATTR_ROLE_ID,   null);
                String deptId   = attr(request, ATTR_DEPT_ID,   null);
                String vendorId = attr(request, ATTR_VENDOR_ID, null);

                if (props.isDbSave() && props.isMatch(userTypeCd, userId)) {
                    String host  = request.getHeader("Host");
                    if (host == null) host = request.getServerName();
                    String ua    = request.getHeader("User-Agent");
                    String query = request.getQueryString();

                    SyhAccessLog entry = SyhAccessLog.builder()
                            .logId(generateId())
                            .reqMethod(request.getMethod())
                            .reqHost(host)
                            .reqPath(request.getRequestURI())
                            .reqQuery(query)
                            .reqIp(resolveIp(request))
                            .reqUa(truncate(ua, 500))
                            .reqBody(captureBody ? bodyOf(reqWrap.getContentAsByteArray(),  props.getMaxBodySize()) : null)
                            .userTypeCd(userTypeCd)
                            .userId(userId)
                            .roleId(roleId)
                            .deptId(deptId)
                            .vendorId(vendorId)
                            .localeId(null)
                            .respStatus(response.getStatus())
                            .respTimeMs(elapsedMs)
                            .respBody(captureBody ? bodyOf(respWrap.getContentAsByteArray(), props.getMaxBodySize()) : null)
                            .serverNm(serverNm)
                            .profile(activeProfile)
                            .threadNm(Thread.currentThread().getName())
                            .reqDt(reqDt)
                            .regDate(LocalDateTime.now())
                            .build();

                    queue.offer(entry);
                }
            } catch (Exception e) {
                System.err.println("[AccessLog] 필터 처리 실패: " + e.getMessage());
            } finally {
                // 응답 바디를 버퍼링한 경우 클라이언트에 실제 전송 (필수)
                if (respWrap != null) respWrap.copyBodyToResponse();
            }
        }
    }

    // ── 유틸 ─────────────────────────────────────────────────────────────

    private static String attr(HttpServletRequest req, String key, String def) {
        Object v = req.getAttribute(key);
        return v instanceof String s ? s : def;
    }

    private static String bodyOf(byte[] bytes, int maxSize) {
        if (bytes == null || bytes.length == 0) return null;
        String body = new String(bytes, StandardCharsets.UTF_8);
        return body.length() <= maxSize ? body : body.substring(0, maxSize);
    }

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    private static String resolveIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        return CmUtil.nvl(ip, "-");
    }

    private static String generateId() {
        String ts = LocalDateTime.now().format(ID_FMT);
        return "AL" + ts + String.format("%04d", (int) (Math.random() * 10000));
    }
}
