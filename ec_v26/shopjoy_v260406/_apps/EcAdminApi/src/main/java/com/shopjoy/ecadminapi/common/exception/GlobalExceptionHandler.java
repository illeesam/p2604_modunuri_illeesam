package com.shopjoy.ecadminapi.common.exception;

import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.HashMap;
import java.util.Map;

/**
 * 전역 예외 핸들러.
 *
 * 모든 Controller에서 발생하는 예외를 일관된 ApiResponse 형태로 변환한다.
 * 오류 응답에는 descErrStack(스택 추적)과 descErrUserInfo(사용자·요청 정보)를 포함한다.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /** @Valid 검증 실패 — 필드별 오류 메시지를 errors 필드에 포함하여 반환 (400) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Map<String, String>>> handleValidation(
            MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }
        return ResponseEntity.badRequest()
            .body(ApiResponse.error(400, "입력 내용을 확인해주세요.", errors)
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 인증/인가 실패 — AuthException에 지정된 HTTP 상태코드로 응답 (기본 401) */
    @ExceptionHandler(CmAuthException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(CmAuthException ex, HttpServletRequest req) {
        log.warn("CmAuthException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 비즈니스 규칙 위반 — BizException에 지정된 HTTP 상태코드로 응답 */
    @ExceptionHandler(CmBizException.class)
    public ResponseEntity<ApiResponse<Void>> handleBusiness(CmBizException ex, HttpServletRequest req) {
        log.warn("CmBizException: {}", ex.getMessage());
        return ResponseEntity.status(ex.getHttpStatus())
            .body(ApiResponse.<Void>error(ex.getHttpStatus().value(), ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 로그인 실패 (아이디/비밀번호 불일치) — 401 */
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Void>> handleBadCredentials(BadCredentialsException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "아이디 또는 비밀번호가 올바르지 않습니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** JWT 없음/만료 등 인증 실패 — 401 */
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Void>> handleAuth(AuthenticationException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(ApiResponse.<Void>error(401, "인증이 필요합니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 권한 부족 (인증은 됐으나 접근 불가) — 403 */
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccess(AccessDeniedException ex, HttpServletRequest req) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
            .body(ApiResponse.<Void>error(403, "접근 권한이 없습니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 잘못된 파라미터 등 인수 오류 — 400 */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Void>> handleIllegalArg(IllegalArgumentException ex, HttpServletRequest req) {
        log.warn("IllegalArgumentException: {}", ex.getMessage());
        return ResponseEntity.badRequest()
            .body(ApiResponse.<Void>error(400, ex.getMessage())
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    /** 그 외 처리되지 않은 예외 — 500 (스택 트레이스 포함 ERROR 로깅) */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGeneral(Exception ex, HttpServletRequest req) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(ApiResponse.<Void>error(500, "서버 오류가 발생했습니다.")
                .withDebug(buildStack(ex), buildUserInfo(req)));
    }

    // ── Private helpers ──────────────────────────────────────────

    /** 예외 스택 추적 문자열 생성 (전체 스택) */
    private String buildStack(Exception ex) {
        StringWriter sw = new StringWriter();
        ex.printStackTrace(new PrintWriter(sw));
        return sw.toString();
    }

    /**
     * 현재 사용자·요청 정보 문자열 생성.
     * 형태: userId=xxx | userType=USER | roleId=R01 | host=127.0.0.1
     *       | url=/api/... | method=POST | params=...(최대200자) | token=~xxxxxxxxxx
     */
    private String buildUserInfo(HttpServletRequest req) {
        String userId   = SecurityUtil.currentUserId();
        String userType = nvl(SecurityUtil.currentUserType());
        String roleId   = nvl(SecurityUtil.currentRoleId());
        String host     = nvl(req.getRemoteAddr());
        String url      = nvl(req.getRequestURI());
        String method   = nvl(req.getMethod());

        String qs = req.getQueryString();
        String params = qs != null ? qs : "";
        if (params.length() > 200) params = params.substring(0, 200) + "…";

        String auth      = req.getHeader("Authorization");
        String tokenTail = "-";
        if (auth != null && auth.length() >= 10) {
            tokenTail = "~" + auth.substring(auth.length() - 10);
        } else if (auth != null) {
            tokenTail = "~" + auth;
        }

        return String.format(
            "userId=%s | userType=%s | roleId=%s | host=%s | url=%s | method=%s | params=%s | token=%s",
            userId, userType, roleId, host, url, method, params, tokenTail
        );
    }

    private String nvl(String v) {
        return v != null ? v : "-";
    }
}
