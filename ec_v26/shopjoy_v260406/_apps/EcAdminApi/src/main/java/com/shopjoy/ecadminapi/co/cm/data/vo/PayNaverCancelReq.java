package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 네이버페이 결제 취소(cancel) 요청 VO.
 *
 * POST https://dev.apis.naver.com/naverpay-partner/naverpay/payments/v1/cancel
 */
@Data
public class PayNaverCancelReq {

    /** 취소할 결제 ID (paymentId, 필수) */
    @NotBlank(message = "paymentId 가 필요합니다.")
    private String paymentId;

    /** 취소 금액 (필수, 부분취소 가능) */
    @NotNull(message = "cancelAmount 가 필요합니다.")
    private Integer cancelAmount;

    /** 취소 사유 (필수) */
    @NotBlank(message = "cancelReason 이 필요합니다.")
    private String cancelReason;

    /** 취소 면세 금액 (기본 0) */
    private Integer taxScopeAmount = 0;

    /** 취소 비과세 금액 (기본 0) */
    private Integer taxExScopeAmount = 0;
}
