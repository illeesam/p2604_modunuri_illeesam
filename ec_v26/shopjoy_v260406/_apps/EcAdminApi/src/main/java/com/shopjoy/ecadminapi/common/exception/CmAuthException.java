package com.shopjoy.ecadminapi.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 인증/인가 실패 예외.
 *
 * 기본 HTTP 상태코드는 401(Unauthorized).
 * 접근 권한 없음은 HttpStatus.FORBIDDEN(403)을 사용.
 */
@Getter
public class CmAuthException extends RuntimeException {

    private final HttpStatus httpStatus;

    /** 401 Unauthorized */
    public CmAuthException(String message) {
        super(message);
        this.httpStatus = HttpStatus.UNAUTHORIZED;
    }

    /** 지정 상태코드 (403 등) */
    public CmAuthException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
