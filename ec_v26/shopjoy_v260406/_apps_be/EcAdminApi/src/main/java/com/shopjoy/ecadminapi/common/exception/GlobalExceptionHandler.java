package com.shopjoy.ecadminapi.common.exception;

import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.config.MyBatisQueryInterceptor;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.MyBatisSystemException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * 전역 예외 핸들러.
 *
 * <p>{@code @RestControllerAdvice} 로 모든 Controller 에서 발생하는 예외를 가로채
 * 일관된 {@link ApiResponse} (ok=false) 형태로 변환한다. 모든 오류 응답에는
 * {@code descErrStack}(app 패키지로 필터링된 스택 추적)과
 * {@code descErrUserInfo}(사용자·요청 정보)를 {@link ApiResponse#withDebug} 로 덧붙인다.</p>
 *
 * <p>핸들러 매핑 요약:
 * <ul>
 *   <li>{@link MethodArgumentNotValidException} → 400 (필드별 errors 맵 포함)</li>
 *   <li>{@link CmAuthException} → 예외에 지정된 상태(기본 401)</li>
 *   <li>{@link CmBizException} → 예외에 지정된 상태(기본 400)</li>
 *   <li>{@link BadCredentialsException} → 401</li>
 *   <li>{@link AuthenticationException} → 401</li>
 *   <li>{@link AccessDeniedException} → 403</li>
 *   <li>{@link IllegalArgumentException} → 400</li>
 *   <li>{@link NoResourceFoundException} → 404</li>
 *   <li>{@link MyBatisSystemException} → 500 (Mapper/DTO 진단 메시지)</li>
 *   <li>그 외 {@link Exception} → 500</li>
 * </ul>
 * 구체 예외 핸들러가 우선 적용되고, 매칭 핸들러가 없으면 {@link #handleGeneral} 가 폴백한다.</p>
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * {@code @Valid}/{@code @Validated} 바인딩 검증 실패를 400 응답으로 변환한다.
     *
     * <p>모든 {@link FieldError} 를 순회해 {@code {필드명: 메시지}} 맵(errors)을 만들고,
     * "필드: 메시지, 필드: 메시지" 형태의 통합 메시지를 함께 구성한다.
     * 필드 오류가 하나도 없으면 "입력 내용을 확인해주세요." 를 기본 메시지로 사용한다.</p>
     *
     * @param ex  필드 바인딩 검증 실패 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 400, body 의 {@code data} 에 필드별 오류 맵을 담은 오류 ApiResponse
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = new HashMap<>();
        StringBuilder msgBuilder = new StringBuilder();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
            if (msgBuilder.length() > 0) msgBuilder.append(", ");
            msgBuilder.append(fe.getField()).append(": ").append(fe.getDefaultMessage());
        }
        String message = msgBuilder.length() > 0 ? msgBuilder.toString() : "입력 내용을 확인해주세요.";
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, message, errors)
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * {@link CmAuthException} 을 예외 자신이 보유한 상태코드 그대로 오류 응답으로 변환한다.
     *
     * <p>기본 401(Unauthorized), 권한 부족 시 403 등. WARN 레벨로 메시지만 로깅한다.</p>
     *
     * @param ex  인증/인가 실패 예외 ({@code httpStatus} 보유)
     * @param req 디버그 정보 추출용 현재 요청
     * @return {@code ex.getHttpStatus()} 상태의 오류 ApiResponse
     */
    @ExceptionHandler(CmAuthException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(CmAuthException ex, HttpServletRequest req) {
        log.warn("CmAuthException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * {@link CmBizException} 을 예외 자신이 보유한 상태코드 그대로 오류 응답으로 변환한다.
     *
     * <p>기본 400(Bad Request), 데이터 미존재 시 404 등. WARN 레벨로 메시지만 로깅한다.
     * 메시지는 그대로 사용자에게 노출되므로 Service 에서 사용자 친화적 문구를 던져야 한다.</p>
     *
     * @param ex  비즈니스 규칙 위반 예외 ({@code httpStatus} 보유)
     * @param req 디버그 정보 추출용 현재 요청
     * @return {@code ex.getHttpStatus()} 상태의 오류 ApiResponse
     */
    @ExceptionHandler(CmBizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(CmBizException ex, HttpServletRequest req) {
        log.warn("CmBizException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * Spring Security 로그인 인증 실패(아이디/비밀번호 불일치)를 401 로 변환한다.
     *
     * <p>보안상 어떤 항목이 틀렸는지 노출하지 않고 고정 메시지
     * "아이디 또는 비밀번호가 올바르지 않습니다." 를 반환한다.</p>
     *
     * @param ex  자격 증명 불일치 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 401 오류 ApiResponse
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "아이디 또는 비밀번호가 올바르지 않습니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * JWT 토큰 누락·만료·서명 오류 등 일반 인증 실패를 401 로 변환한다.
     *
     * <p>{@link BadCredentialsException} 도 {@link AuthenticationException} 의 하위지만
     * 별도 핸들러가 우선 매칭되므로 여기서는 그 외 인증 실패만 처리한다.
     * 고정 메시지 "인증이 필요합니다." 를 반환한다.</p>
     *
     * @param ex  Spring Security 인증 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 401 오류 ApiResponse
     */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "인증이 필요합니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * 인증은 통과했으나 접근 권한이 없는 경우를 403 으로 변환한다.
     *
     * <p>요청 URI 가 {@code /api/bo/} 면 "BO", {@code /api/fo/} 면 "FO" 로 분기해
     * "접근 권한이 없습니다. (BO|FO|-)" 메시지를 구성한다. 권한 위반은 운영상 중요하므로
     * ERROR 레벨로 사용자 정보까지 로깅한다.</p>
     *
     * @param ex  Spring Security 접근 거부 예외
     * @param req 요청 URI 판별 및 디버그 정보 추출용 현재 요청
     * @return HTTP 403 오류 ApiResponse
     */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccess(AccessDeniedException ex, HttpServletRequest req) {
        String uri = CmUtil.nvl(req.getRequestURI(), "");
        String required;
        if (uri.contains("/api/bo/"))  required = "BO";   // BO 전용 API에 접근 시도
        else if (uri.contains("/api/fo/")) required = "FO"; // FO 전용 API에 접근 시도
        else required = "-";
        String msg = "접근 권한이 없습니다. (" + required + ")";
        log.error("AccessDeniedException [403]: {} | {}", msg, buildUserInfo(req));
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.<Void>error(403, msg)
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * 잘못된 인수 등 {@link IllegalArgumentException} 을 400 으로 변환한다.
     *
     * <p>예외 메시지를 그대로 응답 메시지로 사용하므로, 던지는 쪽에서
     * 사용자에게 노출 가능한 문구인지 유의해야 한다. WARN 레벨로 로깅한다.</p>
     *
     * @param ex  잘못된 인수 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 400 오류 ApiResponse
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArg(IllegalArgumentException ex, HttpServletRequest req) {
        log.warn("IllegalArgumentException: {}", ex.getMessage());
        return ResponseEntity.badRequest()
            .body(ApiResponse.<Void>error(400, ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * 매핑된 핸들러/리소스가 없는 요청을 404 로 변환한다.
     *
     * <p>Spring 은 매칭 컨트롤러가 없으면 정적 리소스로 시도하다
     * "No static resource ..." 형태의 {@link NoResourceFoundException} 을 던진다.
     * 여기서는 "API 경로를 찾을 수 없습니다: METHOD URI" 메시지로 가공한다.
     * 스택 대신 예외 메시지를 디버그 stack 자리에 넣는다.</p>
     *
     * @param ex  리소스 미발견 예외
     * @param req 메서드/URI 추출 및 디버그 정보용 현재 요청
     * @return HTTP 404 오류 ApiResponse
     */
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNoResource(NoResourceFoundException ex, HttpServletRequest req) {
        String msg = "API 경로를 찾을 수 없습니다: " + req.getMethod() + " " + req.getRequestURI();
        log.warn("NoResourceFoundException: {}", msg);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.<Void>error(404, msg)
                .withDebug(ex.getMessage(), buildUserInfo(req)));
    }

    /**
     * MyBatis 실행 오류 — Mapper.method, 누락 property, DTO class 를 추출해 메시지 구성.
     *
     * 흔한 케이스 (OGNL ReflectionException):
     *   - Mapper XML <if test="status != null"> 인데 DTO에 status getter 없음
     *   - 컬럼명과 다른 별칭으로 #{} 바인딩한 경우
     *
     * <p>동작: {@code MyBatisQueryInterceptor} 가 기록한 현재 Mapper.method 를 얻고,
     * 예외 cause 체인을 끝까지 따라가 root 메시지를 정규식으로 파싱한다.
     * "property named 'xxx' in 'class ...Yyy' " 패턴이 잡히면 누락 getter 와 DTO
     * 클래스를 안내 메시지에 포함한다. 항상 500 으로 응답하며 원본 예외를
     * 스택과 함께 ERROR 로깅한다.</p>
     *
     * @param ex  MyBatis 실행 시스템 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 500, Mapper/DTO 진단 메시지를 담은 오류 ApiResponse
     */
    @ExceptionHandler(MyBatisSystemException.class)
    public ResponseEntity<ApiResponse<Void>> handleMyBatis(MyBatisSystemException ex, HttpServletRequest req) {
        String mapperInfo = CmUtil.nvl(MyBatisQueryInterceptor.getCurrentMapperInfo(), "(unknown)");
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        String rootMsg = CmUtil.nvl(root.getMessage(), root.getClass().getSimpleName());

        // ReflectionException: "There is no getter for property named 'xxx' in 'class com.shopjoy....Yyy$Request'"
        String property = null, dtoClass = null;
        java.util.regex.Matcher m = java.util.regex.Pattern
            .compile("property named '([^']+)' in '(?:class )?([^']+)'")
            .matcher(rootMsg);
        if (m.find()) { property = m.group(1); dtoClass = m.group(2); }

        StringBuilder msg = new StringBuilder("MyBatis 실행 오류 — ").append(mapperInfo);
        if (property != null) {
            msg.append("\n   ⓘ DTO 누락: ")
               .append(dtoClass).append(" 에 '").append(property).append("' getter 없음.")
               .append("\n   ⓘ Mapper XML 의 <if test=\"").append(property).append(" != null\"> 또는 #{").append(property)
               .append("} 바인딩과 매핑되는 필드가 Request DTO 에 정의돼야 합니다.");
        } else {
            msg.append("\n   ⓘ 원인: ").append(rootMsg);
        }
        log.error("MyBatisSystemException [{}]: {}", mapperInfo, rootMsg, ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.<Void>error(500, msg.toString())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /**
     * 위 핸들러에 매칭되지 않은 모든 예외의 폴백 — 500 으로 변환한다.
     *
     * <p>내부 오류 상세를 숨기기 위해 고정 메시지 "서버 오류가 발생했습니다." 만 반환하고,
     * 실제 원인은 스택 트레이스와 함께 ERROR 레벨로 로깅한다.</p>
     *
     * @param ex  처리되지 않은 일반 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 500 오류 ApiResponse
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.<Void>error(500, "서버 오류가 발생했습니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    // ── Private helpers ──────────────────────────────────────────

    /**
     * 예외 스택 추적을 디버그용 문자열로 가공한다.
     *
     * <p>첫 줄(예외 클래스 + 메시지)은 항상 포함하고, 이후 라인 중
     * org.apache / org.springframework / jakarta.servlet / java.base / com.fasterxml
     * 프레임워크 프레임은 제거해 애플리케이션 코드 흐름만 남긴다.
     * 결과는 {@code descErrStack} 으로 응답에 실린다.</p>
     *
     * @param ex 스택을 추출할 예외
     * @return 필터링된 멀티라인 스택 문자열 (각 줄 끝 개행 포함)
     */
    private String buildStack(Exception ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        String fullStack = sw.toString();

        StringBuilder filtered = new StringBuilder();
        // 첫 줄(예외 클래스 + 메시지)은 항상 포함
        String[] lines = fullStack.split("\n");
        if (lines.length > 0) filtered.append(lines[0]).append("\n");
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i];
            if (!line.contains("org.apache") && !line.contains("org.springframework") &&
                !line.contains("jakarta.servlet") && !line.contains("java.base") && !line.contains("com.fasterxml")) {
                filtered.append(line).append("\n");
            }
        }
        return filtered.toString();
    }

    /**
     * 오류 발생 시점의 사용자·요청 컨텍스트를 한 줄 문자열로 만든다.
     *
     * <p>{@code SecurityUtil.getAuthUser()} 에서 인증 주체 정보를, 요청에서 host/url/method/
     * 쿼리스트링/커스텀 헤더(X-UI-Nm, X-Cmd-Nm)/Authorization 을 모은다.
     * 쿼리스트링은 200자 초과 시 말줄임표로 절단하고, 토큰은 보안상 마지막 10자만
     * "~" 접두로 노출한다. siteId 는 현재 고정 "01". 결과는 {@code descErrUserInfo} 로
     * 응답·로그에 함께 실린다.</p>
     *
     * @param req 사용자/요청 정보를 추출할 현재 요청
     * @return "siteId=.. | userId=.. | ... | token=~xxxxxxxxxx" 형태의 단일 라인 문자열
     */
    private String buildUserInfo(HttpServletRequest req) {
        String siteId      = "01";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId      = authUser.userId();
        String appTypeCd  = CmUtil.nvl(authUser.appTypeCd(), "-");
        String roleId      = CmUtil.nvl(authUser.roleId(), "-");
        String vendorId    = CmUtil.nvl(authUser.vendorId(), "-");
        String host        = CmUtil.nvl(req.getRemoteAddr(), "-");
        String url         = CmUtil.nvl(req.getRequestURI(), "-");
        String method      = CmUtil.nvl(req.getMethod(), "-");

        String qs = req.getQueryString();
        String params = qs != null ? qs : "";
        if (params.length() > 200) params = params.substring(0, 200) + "…";

        String uiNm  = CmUtil.nvl(req.getHeader("X-UI-Nm"),  "-");
        String cmdNm = CmUtil.nvl(req.getHeader("X-Cmd-Nm"), "-");

        String auth      = req.getHeader("Authorization");
        String tokenTail = "-";
        if (auth != null && auth.length() >= 10) {
            tokenTail = "~" + auth.substring(auth.length() - 10);
        } else if (auth != null) {
            tokenTail = "~" + auth;
        }

        return String.format(
            "siteId=%s | userId=%s | appTypeCd=%s | roleId=%s | vendorId=%s | host=%s | url=%s | method=%s | uiNm=%s | cmdNm=%s | params=%s | token=%s",
            siteId, userId, appTypeCd, roleId, vendorId, host, url, method, uiNm, cmdNm, params, tokenTail
        );
    }
}
