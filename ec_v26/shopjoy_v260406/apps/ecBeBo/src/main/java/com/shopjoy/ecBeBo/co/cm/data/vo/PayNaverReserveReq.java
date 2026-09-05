package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 네이버페이 결제 예약(reserve) 요청 VO.
 *
 * POST https://dev.apis.naver.com/naverpay-partner/naverpay/payments/v2.2/reserve
 * 응답의 reserveId 로 결제창 URL 구성: https://pay.naver.com/payments/new?reservationId={reserveId}
 */
@Data
public class PayNaverReserveReq {

    /** 가맹점 주문 번호 (필수, 중복 불가) */
    @NotBlank(message = "merchantPayKey 가 필요합니다.")
    private String merchantPayKey;

    /** 상품명 (필수) */
    @NotBlank(message = "productName 이 필요합니다.")
    private String productName;

    /** 총 결제 금액 (필수, 원 단위) */
    @NotNull(message = "totalPayAmount 가 필요합니다.")
    private Integer totalPayAmount;

    /** 과세 금액 (기본 0) */
    private Integer taxScopeAmount;

    /** 비과세 금액 (기본 0) */
    private Integer taxExScopeAmount;

    /** 결제 완료 후 리다이렉트 URL (필수) */
    @NotBlank(message = "returnUrl 이 필요합니다.")
    private String returnUrl;
}
