package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 카카오페이 결제 취소(cancel) 요청 VO.
 *
 * POST https://open-api.kakaopay.com/online/v1/payment/cancel
 */
@Data
public class PayKakaoCancelReq {

    /** 취소할 결제 고유 번호 (필수) */
    @NotBlank(message = "tid 가 필요합니다.")
    private String tid;

    /** 취소 금액 — 원 단위 (필수, 부분취소 가능) */
    @NotNull(message = "cancelAmount 가 필요합니다.")
    private Integer cancelAmount;

    /** 취소 비과세 금액 (필수, 비과세 없으면 0) */
    @NotNull(message = "cancelTaxFreeAmount 가 필요합니다.")
    private Integer cancelTaxFreeAmount;

    /** 취소 사유 (선택) */
    private String cancelReason;
}
