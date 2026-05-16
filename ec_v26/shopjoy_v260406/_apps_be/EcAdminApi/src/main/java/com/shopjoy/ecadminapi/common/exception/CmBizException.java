package com.shopjoy.ecadminapi.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 비즈니스 규칙 위반 예외.
 *
 * <p>"존재하지 않는 데이터입니다", "이미 사용 중인 코드입니다", "취소 불가 상태입니다" 등
 * 도메인 규칙을 검증하는 Service 레이어에서 발생시킨다.
 * {@link GlobalExceptionHandler#handleBusiness(CmBizException, jakarta.servlet.http.HttpServletRequest)}
 * 가 캐치하여 {@code httpStatus} 에 지정된 상태코드로 ApiResponse.error 로 변환한다.</p>
 *
 * <p>주의: 기본 HTTP 상태코드는 400(Bad Request). 404(데이터 없음)·403(권한) 등 다른 코드가
 * 필요하면 두 번째 생성자를 사용한다. RuntimeException 상속이므로
 * {@code @Transactional} 메서드 내에서 던지면 해당 트랜잭션이 자동 롤백된다.</p>
 */
@Getter
public class CmBizException extends RuntimeException {

    /** 응답에 사용할 HTTP 상태코드 (기본 400, 필요 시 404/403 등). */
    private final HttpStatus httpStatus;

    /**
     * 400 Bad Request 로 응답하는 비즈니스 예외를 생성한다.
     *
     * @param message 사용자/로그에 노출할 위반 사유 메시지
     */
    public CmBizException(String message) {
        super(message);
        this.httpStatus = HttpStatus.BAD_REQUEST;
    }

    /**
     * 지정한 HTTP 상태코드로 응답하는 비즈니스 예외를 생성한다.
     *
     * <p>예: 데이터 미존재 시 {@link HttpStatus#NOT_FOUND}(404),
     * 접근 제한 시 {@link HttpStatus#FORBIDDEN}(403) 을 전달한다.</p>
     *
     * @param message    사용자/로그에 노출할 위반 사유 메시지
     * @param httpStatus 응답에 사용할 HTTP 상태코드
     */
    public CmBizException(String message, HttpStatus httpStatus) {
        super(message);
        this.httpStatus = httpStatus;
    }
}
