package com.shopjoy.ecadminapi.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 인증/인가 실패 예외.
 *
 * <p>토큰 누락·만료·위조, 미인증 접근, 권한 부족 등 인증/인가 계층에서 발생시킨다.
 * {@link GlobalExceptionHandler#handleAuth(CmAuthException, jakarta.servlet.http.HttpServletRequest)}
 * 가 캐치하여 {@code httpStatus} 에 지정된 상태코드 그대로 ApiResponse.error 로 변환한다.</p>
 *
 * <p>주의: 기본 HTTP 상태코드는 401(Unauthorized) — 인증 자체가 실패한 경우.
 * 인증은 됐으나 접근 권한이 없는 경우(예: BO 사용자가 FO 전용 API 호출)에는
 * 두 번째 생성자로 {@link HttpStatus#FORBIDDEN}(403) 을 명시한다.
 * RuntimeException 상속이므로 {@code @Transactional} 메서드 내에서 던지면 자동 롤백된다.</p>
 */
@Getter
public class CmAuthException extends RuntimeException {

    /** 응답에 사용할 HTTP 상태코드 (기본 401, 권한 부족 시 403 등). */
    private final HttpStatus httpStatus;

    /**
     * 401 Unauthorized 로 응답하는 인증 실패 예외를 생성한다.
     *
     * @param message 사용자/로그에 노출할 실패 사유 메시지
     */
    public CmAuthException(String message) {
        super(message);
        this.httpStatus = HttpStatus.UNAUTHORIZED;
    }

    /**
     * 지정한 HTTP 상태코드로 응답하는 인증/인가 실패 예외를 생성한다.
     *
     * <p>접근 권한 없음은 {@link HttpStatus#FORBIDDEN}(403) 을 전달하는 식으로 사용한다.</p>
     *
     * @param message    사용자/로그에 노출할 실패 사유 메시지
     * @param httpStatus 응답에 사용할 HTTP 상태코드 (403 등)
     */
    public CmAuthException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
