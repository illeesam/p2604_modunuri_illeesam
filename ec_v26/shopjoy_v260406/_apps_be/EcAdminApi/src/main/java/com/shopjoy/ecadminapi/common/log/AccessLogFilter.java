package com.shopjoy.ecadminapi.common.log;

import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessLog;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;
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
 * - 체인 완료 후 request attribute (_authUserId, _authAppType, _authRoleId) 로 인증 정보 수집.
 *   (JwtAuthFilter 가 MDC를 finally 에서 clear 하므로 request attribute 방식 사용)
 * - AccessLogProperties.isMatch() 조건 통과 시에만 큐에 적재.
 */
public class AccessLogFilter extends OncePerRequestFilter {

    /** JwtAuthFilter 가 request attribute 에 설정하는 키 */
    public static final String ATTR_USER_ID   = "_authUserId";
    public static final String ATTR_APP_TYPE_CD = "_authAppTypeCd";
    public static final String ATTR_ROLE_ID   = "_authRoleId";
    public static final String ATTR_DEPT_ID   = "_authDeptId";
    public static final String ATTR_VENDOR_ID = "_authVendorId";

    /** site_id 는 NOT NULL — X-Site-Id 헤더 미수신 시 대표 사이트로 fallback */
    private static final String DEFAULT_SITE_ID = "SITE000001";

    /** logId 생성용 타임스탬프 포맷 (yyMMddHHmmss) */
    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** 비동기 적재 큐 — 요청 스레드는 offer 만 하고 즉시 반환 */
    private final AccessLogQueue      queue;
    /** 기록 여부·대상 판별 설정 (dbSave / filter / maxBodySize) */
    private final AccessLogProperties props;
    /** 로그 레코드의 server_nm 컬럼에 기록할 서버 호스트명 */
    private final String              serverNm;
    /** 로그 레코드의 profile 컬럼에 기록할 활성 프로파일 문자열 */
    private final String              activeProfile;

    /**
     * 필터 인스턴스 생성자.
     *
     * <p>Spring 빈이 아니라 {@link AccessLogConfig} 에서 직접 생성·등록되므로 의존성을
     * 생성자 인자로 받는다.
     *
     * @param queue         비동기 적재 큐
     * @param props         액세스 로그 설정
     * @param serverNm      서버 호스트명
     * @param activeProfile 활성 프로파일 문자열
     */
    public AccessLogFilter(AccessLogQueue queue, AccessLogProperties props,
                           String serverNm, String activeProfile) {
        this.queue         = queue;
        this.props         = props;
        this.serverNm      = serverNm;
        this.activeProfile = activeProfile;
    }

    /** CORS preflight (OPTIONS) 는 비즈니스 정보가 없으므로 로그 적재 자체 skip */
    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        return "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    /**
     * 요청 1건당 1회 실행되어 체인 전후를 감싸고 액세스 로그를 큐에 적재한다.
     *
     * <p>동작 순서:
     * <ol>
     *   <li>maxBodySize&gt;0 이면 요청/응답을 ContentCaching 래퍼로 감싸 바디를 버퍼링한다.</li>
     *   <li>요청 시각·시작 시점을 기록한 뒤 체인을 실행한다(인증/컨트롤러 포함).</li>
     *   <li>finally 에서 체인이 request attribute 에 남긴 인증 정보(_authUserId 등)를 수집한다.
     *       (JwtAuthFilter 가 MDC 를 finally 에서 clear 하므로 MDC 가 아닌 attribute 사용)</li>
     *   <li>dbSave 이고 isMatch 통과 시 SyhAccessLog 를 빌드하여 큐에 offer 한다.</li>
     * </ol>
     *
     * <p>엣지케이스: 로그 빌드 중 예외가 발생해도 실제 요청 처리에 영향을 주지 않도록
     * catch 하여 System.err 로만 출력한다. 응답 바디를 버퍼링한 경우 마지막 finally 에서
     * 반드시 copyBodyToResponse() 를 호출해야 클라이언트에 응답이 실제 전송된다(필수).
     * 큐가 가득 차면 offer 내부에서 드롭되어 요청 스레드는 지연 없이 진행된다.
     *
     * @param request  원본 HTTP 요청
     * @param response 원본 HTTP 응답
     * @param chain    이후 필터 체인
     * @throws ServletException 체인 처리 중 서블릿 예외
     * @throws IOException      체인 처리 중 입출력 예외
     */
    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain chain) throws ServletException, IOException {
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
                String appTypeCd = attr(request, ATTR_APP_TYPE_CD, "-");
                String roleId   = attr(request, ATTR_ROLE_ID,   null);
                String deptId   = attr(request, ATTR_DEPT_ID,   null);
                String vendorId = attr(request, ATTR_VENDOR_ID, null);

                if (props.isDbSave() && props.isMatch(appTypeCd, userId)) {
                    String host  = request.getHeader("Host");
                    if (host == null) host = request.getServerName();
                    String ua    = request.getHeader("User-Agent");
                    String query = request.getQueryString();

                    // x- 헤더 수집 (한글 URI 인코딩 디코딩)
                    String uiNm   = decodeHdr(request.getHeader("X-UI-Nm"));
                    String cmdNm  = decodeHdr(request.getHeader("X-Cmd-Nm"));
                    String fileNm = request.getHeader("X-File-Nm");
                    String funcNm = request.getHeader("X-Func-Nm");
                    String lineNo = request.getHeader("X-Line-No");
                    String traceId = request.getHeader("X-Trace-Id");

                    // site_id 는 NOT NULL — X-Site-Id 헤더값 사용, 없으면 대표 사이트로 fallback
                    String siteId = request.getHeader("X-Site-Id");
                    if (siteId == null || siteId.isBlank()) siteId = DEFAULT_SITE_ID;

                    SyhAccessLog entry = SyhAccessLog.builder()
                            .logId(generateId())
                            .reqMethod(request.getMethod())
                            .reqHost(host)
                            .reqPath(request.getRequestURI())
                            .reqQuery(query)
                            .reqIp(resolveIp(request))
                            .reqUa(truncate(ua, 500))
                            .reqBody(captureBody ? bodyOf(reqWrap.getContentAsByteArray(),  props.getMaxBodySize()) : null)
                            .siteId(siteId)
                            .appTypeCd(appTypeCd)
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
                            .uiNm(truncate(uiNm, 200))
                            .cmdNm(truncate(cmdNm, 200))
                            .fileNm(truncate(fileNm, 200))
                            .funcNm(truncate(funcNm, 200))
                            .lineNo(truncate(lineNo, 10))
                            .traceId(truncate(traceId, 50))
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

    /**
     * request attribute 값을 String 으로 안전하게 꺼낸다.
     *
     * @param req 요청
     * @param key attribute 키
     * @param def 값이 없거나 String 이 아닐 때 사용할 기본값
     * @return attribute 의 String 값, 없으면 def
     */
    private static String attr(HttpServletRequest req, String key, String def) {
        Object v = req.getAttribute(key);
        return v instanceof String s ? s : def;
    }

    /**
     * 버퍼링된 바디 바이트를 UTF-8 문자열로 변환하고 maxSize 로 절단한다.
     *
     * @param bytes   ContentCaching 래퍼가 캐시한 바디 바이트 (null/빈 배열 허용)
     * @param maxSize 최대 보존 길이(문자 수)
     * @return 바디 문자열, 바디가 없으면 null
     */
    private static String bodyOf(byte[] bytes, int maxSize) {
        if (bytes == null || bytes.length == 0) return null;
        String body = new String(bytes, StandardCharsets.UTF_8);
        return body.length() <= maxSize ? body : body.substring(0, maxSize);
    }

    /**
     * 컬럼 길이 제약에 맞춰 문자열을 절단한다.
     *
     * @param s   원본 문자열 (null 허용)
     * @param max 최대 길이
     * @return 절단된 문자열, 입력이 null 이면 null
     */
    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }

    /**
     * URL 인코딩된 헤더 값(한글 UI명/명령명 등)을 UTF-8 로 디코딩한다.
     *
     * <p>디코딩 실패 시 원본 문자열을 그대로 반환해 로그 적재가 끊기지 않도록 한다.
     *
     * @param s 헤더 원본 값 (null 허용)
     * @return 디코딩된 문자열, 입력이 null 이면 null, 실패 시 원본
     */
    private static String decodeHdr(String s) {
        if (s == null) return null;
        try { return java.net.URLDecoder.decode(s, StandardCharsets.UTF_8); } catch (Exception e) { return s; }
    }

    /**
     * 프록시/로드밸런서를 고려해 실제 클라이언트 IP 를 결정한다.
     *
     * <p>X-Forwarded-For → X-Real-IP → remoteAddr 순으로 우선 적용하며,
     * X-Forwarded-For 가 콤마로 여러 IP 를 담은 경우 첫 번째(최초 클라이언트)만 취한다.
     *
     * @param request 요청
     * @return 클라이언트 IP, 식별 불가 시 "-"
     */
    private static String resolveIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getHeader("X-Real-IP");
        if (ip == null || ip.isBlank() || "unknown".equalsIgnoreCase(ip))
            ip = request.getRemoteAddr();
        if (ip != null && ip.contains(",")) ip = ip.split(",")[0].trim();
        return CmUtil.nvl(ip, "-");
    }

    /**
     * 액세스 로그 PK(log_id)를 생성한다.
     *
     * <p>형식: "AL" + yyMMddHHmmss(12자리) + 4자리 난수. 초 단위 동시 다발 요청의
     * 충돌 가능성을 난수로 완화한다.
     *
     * @return 생성된 로그 ID
     */
    private static String generateId() {
        String ts = LocalDateTime.now().format(ID_FMT);
        return "AL" + ts + String.format("%04d", (int) (Math.random() * 10000));
    }
}
