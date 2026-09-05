package com.shopjoy.ecadminapi.common.exception;

import com.shopjoy.ecadminapi.co.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.common.config.CorsOriginPolicy;
import com.shopjoy.ecadminapi.common.config.MyBatisQueryInterceptor;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mybatis.spring.MyBatisSystemException;
import org.springframework.core.env.Environment;
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
import java.util.Arrays;
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
 * <p>2026-08-30: 단, <b>prod 프로파일의 FO(/api/fo/**) 요청</b>은 예외 — 스택 추적과
 * 사용자·요청 정보(IP·토큰 뒷자리 포함)를 비운 가벼운 응답을 내려준다({@link #isLightweightDebug}).
 * BO 는 프로파일 무관 항상 전체 디버그 정보를 받는다(관리자 화면의 "최근 서버오류" 패널이
 * descErrStack 을 그대로 파싱해서 보여주므로 이 정보가 필요) — FO(일반 고객)에게까지 내부
 * 클래스명·IP·토큰 조각이 나가는 걸 막는 게 목적이라 BO 는 건드리지 않는다. local/dev
 * 프로파일에서는 FO 도 지금처럼 전체 정보를 받는다(개발 편의).</p>
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
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    private final Environment environment;

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
        // log.error 로 남겨야 DbErrorLogAppender 가 syh_access_error_log 에 적재한다.
        log.error("MethodArgumentNotValidException [400]: {}", message, ex);
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, message, errors)
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
    }

    /**
     * Entity 저장(flush) 시점에 Hibernate 가 던지는 Bean Validation 위반을 400 으로 변환한다.
     *
     * <p>컨트롤러에 {@code @Valid} 가 붙지 않은 경로(내부 서비스 저장 등)에서 Entity 의
     * {@code @NotBlank}/{@code @Size} 가 걸리면 기본적으로 500 으로 나가버린다.
     * 입력값 문제를 서버 오류로 보이게 하지 않도록 여기서 400 + 필드별 오류 맵으로 정규화한다.</p>
     *
     * @param ex  제약조건 위반 예외
     * @param req 디버그 정보 추출용 현재 요청
     * @return HTTP 400, body 의 {@code data} 에 필드별 오류 맵을 담은 오류 ApiResponse
     */
    @ExceptionHandler(jakarta.validation.ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleConstraintViolation(
            jakarta.validation.ConstraintViolationException ex, HttpServletRequest req) {
        Map<String, String> errors = new HashMap<>();
        StringBuilder msgBuilder = new StringBuilder();
        for (jakarta.validation.ConstraintViolation<?> cv : ex.getConstraintViolations()) {
            String field = cv.getPropertyPath() == null ? "" : cv.getPropertyPath().toString();
            errors.put(field, cv.getMessage());
            if (msgBuilder.length() > 0) msgBuilder.append(", ");
            msgBuilder.append(cv.getMessage());
        }
        String message = msgBuilder.length() > 0 ? msgBuilder.toString() : "입력 내용을 확인해주세요.";
        log.error("ConstraintViolationException [400]: {}", message, ex);
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, message, errors)
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        log.error("CmAuthException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        log.error("CmBizException: {}", ex.getMessage(), ex);
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        // log.error 로 남겨야 DbErrorLogAppender 가 syh_access_error_log 에 적재한다.
        log.error("BadCredentialsException [401]: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "아이디 또는 비밀번호가 올바르지 않습니다.")
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        // log.error 로 남겨야 DbErrorLogAppender 가 syh_access_error_log 에 적재한다.
        log.error("AuthenticationException [401]: {}", ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "인증이 필요합니다.")
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        String uri = CmUtil.nvlStr(req.getRequestURI(), "");
        String required;
        if (uri.contains("/api/bo/"))  required = "BO";   // BO 전용 API에 접근 시도
        else if (uri.contains("/api/fo/")) required = "FO"; // FO 전용 API에 접근 시도
        else required = "-";
        String msg = "접근 권한이 없습니다. (" + required + ")";
        log.error("AccessDeniedException [403]: {} | {}", msg, buildUserInfo(req));
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.<Void>error(403, msg)
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        log.error("IllegalArgumentException: {}", ex.getMessage(), ex);
        return ResponseEntity.badRequest()
            .body(ApiResponse.<Void>error(400, ex.getMessage())
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        log.error("NoResourceFoundException: {}", msg, ex);
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ApiResponse.<Void>error(404, msg)
                .withDebug(isLightweightDebug(req) ? "" : ex.getMessage(), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
        String mapperInfo = CmUtil.nvlStr(MyBatisQueryInterceptor.getCurrentMapperInfo(), "(unknown)");
        Throwable root = ex;
        while (root.getCause() != null && root.getCause() != root) root = root.getCause();
        String rootMsg = CmUtil.nvlStr(root.getMessage(), root.getClass().getSimpleName());

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
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
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
                .withDebug(buildStack(ex, req), buildUserInfoForResponse(req)).withCorsHint(buildCorsHint(req)));
    }

    // ── Private helpers ──────────────────────────────────────────

    /**
     * prod 프로파일의 FO(/api/fo/**) 요청이면 true — 이 경우 스택/사용자정보를 비운
     * 가벼운 오류 응답을 내려준다(2026-08-30 추가). BO 는 프로파일 무관 항상 false
     * (관리자 "최근 서버오류" 패널이 descErrStack 을 그대로 써야 하므로).
     *
     * @param req 요청 URI 판별용 현재 요청
     * @return prod 프로파일이면서 /api/fo/ 로 시작하는 요청이면 true
     */
    private boolean isLightweightDebug(HttpServletRequest req) {
        boolean isProd = environment.matchesProfiles("prod");
        boolean isFo = CmUtil.nvlStr(req.getRequestURI(), "").contains("/api/fo/");
        return isProd && isFo;
    }

    /**
     * CORS 진단 힌트를 만든다 — 2026-08-30 추가.
     *
     * <p>브라우저의 실제 CORS 위반(특히 preflight 거부)은 Spring 이 필터 단계에서 예외 없이
     * 바로 403 을 써버려서 이 {@code @RestControllerAdvice} 까지 애초에 도달하지 않는다 —
     * 그래서 "CORS 오류 자체"를 여기서 잡는 건 불가능하다. 대신 이 핸들러를 타는 <b>모든</b>
     * 오류 응답에 대해 "지금 이 요청의 Origin 이 CORS 허용 목록에 있는지"를 부가 정보로
     * 알려준다 — 뭔가 안 되는 상황에서 "혹시 CORS 문제인가?" 를 코드 안 안 보고 바로 확인할 수
     * 있게 하는 게 목적. prod 는 허용 목록 자체를 공격자에게 노출할 이유가 없어 항상 null.</p>
     *
     * @param req 현재 요청 (Origin 헤더 추출용)
     * @return Origin 이 허용 목록에 없을 때만 안내 문자열, 그 외(prod / Origin 헤더 없음 /
     *         이미 허용된 Origin)는 null(JSON 에서 생략됨)
     */
    private String buildCorsHint(HttpServletRequest req) {
        if (environment.matchesProfiles("prod")) return null;
        String origin = req.getHeader("Origin");
        if (origin == null || origin.isBlank()) return null; // 크로스오리진 요청이 아님(같은 오리진이거나 서버간 호출)
        if (isOriginAllowed(origin)) return null; // 이미 허용 목록에 있음 — CORS 문제 아님
        return "Origin '" + origin + "' 은(는) CORS 허용 목록에 없습니다. 허용된 Origin 패턴: "
            + String.join(", ", CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS);
    }

    /**
     * origin 이 {@link CorsOriginPolicy#ALLOWED_ORIGIN_PATTERNS} 의 패턴 중 하나와 일치하는지
     * 확인한다. 패턴은 정확히 두 형태뿐이라(끝이 {@code :*} 인 포트 와일드카드, 또는 완전
     * 문자열) 정규식 없이 단순 비교로 충분하다 — SecurityConfig 의 실제 CORS 판정 로직과
     * 완전히 동일하진 않을 수 있어(Spring 내부는 더 정교하다) 이건 어디까지나 "대략 맞는지"
     * 보여주는 진단용 힌트지, 판정 자체를 대신하지 않는다.
     *
     * @param origin 요청의 Origin 헤더 값
     * @return 허용 패턴 중 하나라도 일치하면 true
     */
    private boolean isOriginAllowed(String origin) {
        for (String pattern : CorsOriginPolicy.ALLOWED_ORIGIN_PATTERNS) {
            if (pattern.endsWith(":*")) {
                if (origin.startsWith(pattern.substring(0, pattern.length() - 1))) return true;
            } else if (pattern.equals(origin)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 스택 필터링 화이트리스트 기준 패키지 — 2026-08-30: 블랙리스트(프레임워크 패키지명을
     * 하나하나 나열)에서 화이트리스트로 전환. 새 라이브러리가 추가될 때마다 블랙리스트에
     * 빠진 패키지가 계속 새는 문제가 있었다 — 화이트리스트는 "우리 코드 패키지"라는 기준
     * 하나만 유지하면 되므로 더 안전하다.
     *
     * <p>이 클래스({@code GlobalExceptionHandler})의 패키지({@code com.shopjoy.ecadminapi.common.exception})
     * 에서 앞 3단계({@code com.shopjoy.ecadminapi})만 뽑아 기준으로 쓴다 — 문자열로
     * 하드코딩하지 않고 클래스 자신의 패키지에서 유도하므로, 프로젝트 루트 패키지가
     * 바뀌어도 이 상수를 손으로 고칠 필요가 없다.</p>
     */
    private static final String APP_BASE_PACKAGE = resolveBasePackage(GlobalExceptionHandler.class, 3);

    /**
     * 클래스의 패키지명에서 앞 {@code levels} 단계만 잘라낸다.
     * 예) {@code com.shopjoy.ecadminapi.common.exception}, levels=3 → {@code com.shopjoy.ecadminapi}
     *
     * @param clazz  패키지를 뽑아올 클래스
     * @param levels 유지할 패키지 단계 수(클래스 패키지가 이보다 얕으면 전체를 반환)
     * @return 앞 {@code levels} 단계로 자른 패키지명
     */
    private static String resolveBasePackage(Class<?> clazz, int levels) {
        String[] parts = clazz.getPackage().getName().split("\\.");
        int n = Math.min(levels, parts.length);
        return String.join(".", Arrays.copyOfRange(parts, 0, n));
    }

    /**
     * 예외 스택 추적을 디버그용 문자열로 가공한다.
     *
     * <p>첫 줄(예외 클래스 + 메시지)은 항상 포함하고, 이후 라인은 {@link #APP_BASE_PACKAGE}
     * (이 클래스 패키지의 앞 3단계, 예: {@code com.shopjoy.ecadminapi}) 소속 프레임만
     * 화이트리스트로 남긴다 — 그 외(Spring/서블릿/JDK/서드파티 라이브러리 등) 프레임은 전부
     * 제거해 애플리케이션 코드 흐름만 남긴다. 그리고 바로 위 줄과 완전히 같은 줄이 연달아
     * 나오면(AOP 프록시 래핑 등으로 흔함) 하나만 남기고 나머지는 건너뛴다.
     * 결과는 {@code descErrStack} 으로 응답에 실린다.</p>
     *
     * <p>{@link #isLightweightDebug} 가 true(prod + FO) 면 스택을 만들지 않고 빈 문자열을
     * 바로 반환한다.</p>
     *
     * @param ex  스택을 추출할 예외
     * @param req 경량 응답 여부 판별용 현재 요청
     * @return 필터링·중복제거된 멀티라인 스택 문자열 (각 줄 끝 개행 포함), 경량 응답 대상이면 빈 문자열
     */
    private String buildStack(Exception ex, HttpServletRequest req) {
        if (isLightweightDebug(req)) return "";
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        String fullStack = sw.toString();

        String[] lines = fullStack.split("\n");
        StringBuilder filtered = new StringBuilder();
        String prevLine = null;
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];
            // 첫 줄(예외 클래스 + 메시지)은 패키지 필터 없이 항상 포함, 이후 줄은 화이트리스트 통과분만
            boolean keep = (i == 0) || line.contains(APP_BASE_PACKAGE);
            if (!keep) continue;
            if (line.equals(prevLine)) continue; // 바로 위 줄과 동일하면 중복 스킵
            filtered.append(line).append("\n");
            prevLine = line;
        }
        return filtered.toString();
    }

    /**
     * {@link #buildUserInfo} 를 "API 응답 본문(descErrUserInfo)"에 실을 때만 거치는 래퍼.
     *
     * <p>{@link #isLightweightDebug} 가 true(prod + FO) 면 빈 문자열을 반환해 IP·토큰 뒷자리
     * 같은 정보가 고객에게 나가는 걸 막는다. <b>서버 로그(log.error)는 이 래퍼를 거치지 않고
     * {@link #buildUserInfo} 를 직접 호출</b>하므로 — 운영자가 볼 로그 파일은 FO/prod 여도
     * 항상 전체 정보가 남는다(디버깅용 정보를 숨겨야 할 대상은 "고객에게 보이는 응답"이지
     * "서버가 자기 로그에 남기는 것"이 아니므로 구분했다).</p>
     *
     * @param req 사용자/요청 정보를 추출할 현재 요청
     * @return 경량 응답 대상이면 빈 문자열, 아니면 {@link #buildUserInfo} 결과 그대로
     */
    private String buildUserInfoForResponse(HttpServletRequest req) {
        if (isLightweightDebug(req)) return "";
        return buildUserInfo(req);
    }

    /**
     * 오류 발생 시점의 사용자·요청 컨텍스트를 한 줄 문자열로 만든다.
     *
     * <p>{@code SecurityUtil.getAuthUser()} 에서 인증 주체 정보를, 요청에서 host/url/method/
     * 쿼리스트링/커스텀 헤더(X-UI-Nm, X-Cmd-Nm)/Authorization 을 모은다.
     * 쿼리스트링은 200자 초과 시 말줄임표로 절단하고, 토큰은 보안상 마지막 10자만
     * "~" 접두로 노출한다. siteId 는 현재 고정 "01". 결과는 {@code descErrUserInfo} 로
     * 응답·로그에 함께 실린다. <b>항상 전체 정보를 반환</b>한다 — 응답 본문에 실을 때
     * 가볍게 걸러야 하면 {@link #buildUserInfoForResponse} 를 대신 쓸 것.</p>
     *
     * @param req 사용자/요청 정보를 추출할 현재 요청
     * @return "siteId=.. | userId=.. | ... | token=~xxxxxxxxxx" 형태의 단일 라인 문자열
     */
    private String buildUserInfo(HttpServletRequest req) {
        String siteId      = "01";
        AuthPrincipal authUser = SecurityUtil.getAuthUser();
        String userId      = authUser.userId();
        String appTypeCd  = CmUtil.nvlStr(authUser.appTypeCd(), "-");
        String roleId      = CmUtil.nvlStr(authUser.roleId(), "-");
        String vendorId    = CmUtil.nvlStr(authUser.vendorId(), "-");
        String host        = CmUtil.nvlStr(req.getRemoteAddr(), "-");
        String url         = CmUtil.nvlStr(req.getRequestURI(), "-");
        String method      = CmUtil.nvlStr(req.getMethod(), "-");

        String qs = req.getQueryString();
        String params = CmUtil.nvlStr(qs);
        if (params.length() > 200) params = params.substring(0, 200) + "…";

        String uiNm  = CmUtil.nvlStr(req.getHeader("X-UI-Nm"),  "-");
        String cmdNm = CmUtil.nvlStr(req.getHeader("X-Cmd-Nm"), "-");

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
