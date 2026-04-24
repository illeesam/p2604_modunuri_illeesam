package com.shopjoy.ecadminapi.common.license.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 라이선스 검증 실패 예외.
 * LicenseFilter / LicenseUtil 에서 발생 → GlobalExceptionHandler가 403으로 변환.
 */
@Getter
public class LicenseException extends RuntimeException {

    public enum Reason {
        NO_HEADER,          // 헤더 없음
        INVALID_FORMAT,     // 코드 형식 오류
        INVALID_SIGNATURE,  // 서명 불일치
        SITE_MISMATCH,      // siteId 불일치
        EXPIRED,            // 만료
        UNKNOWN,            // 기타
    }

    private final Reason reason;
    private final HttpStatus httpStatus;

    public LicenseException(Reason reason, String message) {
        super(message);
        this.reason     = reason;
        this.httpStatus = HttpStatus.FORBIDDEN;
    }
}
