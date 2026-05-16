package com.shopjoy.ecadminapi.common.license.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 라이선스 검증 실패 예외.
 *
 * <p>역할: 라이선스 코드(헤더 {@code X-License-Code})의 형식·서명·소유자·만료 검증
 * 단계에서 문제가 발견되면 던지는 런타임 예외. {@link LicenseUtil#verify} 와
 * (활성화 시) {@code LicenseFilter} 에서 발생한다.</p>
 *
 * <p>동작 시점: 모든 보호 대상 API 진입 시 라이선스 검증 단계. 예외 발생 →
 * {@code GlobalExceptionHandler} 가 가로채 HTTP 403(FORBIDDEN) 응답으로 변환한다.</p>
 *
 * <p>보안 주의: {@link #getMessage()} 에 실제 expected/actual 값이 포함될 수 있으므로
 * (예: buyerId 불일치 메시지) 응답 본문에 그대로 노출할 때는 정보 누출 범위에 유의한다.
 * 실패 사유는 {@link Reason} 으로 분류되어 클라이언트가 원인을 식별할 수 있다.</p>
 */
@Getter
public class LicenseException extends RuntimeException {

    /**
     * 라이선스 검증 실패 사유 분류.
     *
     * <p>응답 JSON 의 {@code reason} 필드로 그대로 노출되며, 검증 단계 순서대로
     * 어디서 막혔는지를 식별하는 용도로 사용된다.</p>
     */
    public enum Reason {
        /** 헤더({@code X-License-Code}) 자체가 없거나 빈 값 — 라이선스 미주입. */
        NO_HEADER,
        /** 코드 형식 오류 — {@code Base64.서명} 2분할 실패 / payload 파싱·만료일 형식 오류. */
        INVALID_FORMAT,
        /** 서명 불일치 — HMAC-SHA256 재계산값과 코드 내 서명이 다름(위·변조 의심). */
        INVALID_SIGNATURE,
        /** 소유자(buyerId) 또는 사이트(siteId) 불일치 — 타 사이트/타 구매자 라이선스 재사용. */
        SITE_MISMATCH,
        /** 만료 — payload 의 expireDate 가 오늘 이전. */
        EXPIRED,
        /** 기타 분류 불가 사유. */
        UNKNOWN,
    }

    /** 실패 사유 분류. 응답 {@code reason} 필드 및 로깅에 사용. */
    private final Reason reason;

    /** 응답 HTTP 상태. 라이선스 위반은 일률적으로 403(FORBIDDEN) 고정. */
    private final HttpStatus httpStatus;

    /**
     * 라이선스 예외 생성.
     *
     * <p>{@code httpStatus} 는 사유와 무관하게 항상 {@link HttpStatus#FORBIDDEN} 으로
     * 고정한다 — 라이선스 위반은 인증(401)이 아닌 인가(403) 성격이며, 어느 단계에서
     * 실패했는지를 상태 코드로 구분하지 않는다(공격자에게 단계 정보 노출 방지).</p>
     *
     * @param reason  실패 사유 분류(검증 단계 식별)
     * @param message 사람이 읽을 상세 메시지(응답 {@code message} 필드로 노출)
     */
    public LicenseException(Reason reason, String message) {
        super(message);
        this.reason     = reason;
        this.httpStatus = HttpStatus.FORBIDDEN;
    }
}
