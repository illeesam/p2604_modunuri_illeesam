package com.shopjoy.ecadminapi.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 비즈니스 규칙 위반 예외.
 *
 * Service 레이어에서 발생시키며 GlobalExceptionHandler가 캐치해 ApiResponse.error로 변환한다.
 * 기본 HTTP 상태코드는 400(Bad Request). 403/404 등 다른 코드가 필요하면 두 번째 생성자 사용.
 *
 * @Transactional 메서드 내에서 던지면 자동 롤백된다.
 */
@Getter
public class CmBizException extends RuntimeException {

    private final HttpStatus httpStatus;

    /** 400 Bad Request로 응답한다. */
    public CmBizException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    /** 지정한 HTTP 상태코드로 응답한다. */
    public CmBizException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
