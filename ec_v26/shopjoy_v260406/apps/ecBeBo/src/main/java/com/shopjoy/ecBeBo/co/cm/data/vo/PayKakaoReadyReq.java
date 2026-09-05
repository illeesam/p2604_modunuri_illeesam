package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 카카오페이 결제 준비(ready) 요청 VO.
 *
 * POST https://open-api.kakaopay.com/online/v1/payment/ready
 */
@Data
public class PayKakaoReadyReq {

    /** 가맹점 주문 번호 (필수) */
    @NotBlank(message = "partnerOrderId 가 필요합니다.")
    private String partnerOrderId;

    /** 가맹점 회원 ID (필수) */
    @NotBlank(message = "partnerUserId 가 필요합니다.")
    private String partnerUserId;

    /** 상품명 (필수) */
    @NotBlank(message = "itemName 이 필요합니다.")
    private String itemName;

    /** 상품 총액 — 원 단위 (필수) */
    @NotNull(message = "totalAmount 가 필요합니다.")
    private Integer totalAmount;

    /** 비과세 금액 (기본 0) */
    private Integer taxFreeAmount;

    /** 결제 승인 후 리다이렉트 URL (필수) */
    @NotBlank(message = "approvalUrl 이 필요합니다.")
    private String approvalUrl;

    /** 결제 취소 후 리다이렉트 URL (필수) */
    @NotBlank(message = "cancelUrl 이 필요합니다.")
    private String cancelUrl;

    /** 결제 실패 후 리다이렉트 URL (필수) */
    @NotBlank(message = "failUrl 이 필요합니다.")
    private String failUrl;
}
