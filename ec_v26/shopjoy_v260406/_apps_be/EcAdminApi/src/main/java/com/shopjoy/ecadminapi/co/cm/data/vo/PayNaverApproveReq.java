package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 네이버페이 결제 승인(approve) 요청 VO.
 *
 * POST https://dev.apis.naver.com/naverpay-partner/naverpay/payments/v1/approval
 * returnUrl 리다이렉트 시 받은 paymentId 로 승인.
 */
@Data
public class PayNaverApproveReq {

    /** reserve 응답의 reserveId */
    @NotBlank(message = "reserveId 가 필요합니다.")
    private String reserveId;

    /** returnUrl 리다이렉트 파라미터로 전달되는 결제 ID (필수) */
    @NotBlank(message = "paymentId 가 필요합니다.")
    private String paymentId;
}
