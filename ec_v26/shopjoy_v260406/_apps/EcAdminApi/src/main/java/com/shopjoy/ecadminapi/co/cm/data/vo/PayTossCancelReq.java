package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * 토스페이먼츠 결제 취소/부분환불(cancel) 요청 VO.
 * sy_prop 키: app.pay.toss.secret-key / app.pay.toss.cancel-url-base
 *
 * <p>전액취소: cancelAmount = null
 * <p>부분취소: cancelAmount = 양수 금액 (1 이상, pay_amt 이하는 서비스에서 검증)
 */
@Data
public class PayTossCancelReq {

    @NotBlank(message = "paymentKey 가 필요합니다.")
    @Size(max = 200, message = "paymentKey 는 200자 이하여야 합니다.")
    private String paymentKey;

    @NotBlank(message = "cancelReason 이 필요합니다.")
    @Size(max = 200, message = "cancelReason 은 200자 이하여야 합니다.")
    private String cancelReason;

    /**
     * null = 전액취소, 양수 = 부분취소 금액.
     * 0 또는 음수는 허용하지 않음 — @Min(1) 적용.
     * pay_amt / balance_amt 초과 여부는 CmPayTossService 에서 DB 조회 후 검증.
     */
    @Min(value = 1, message = "cancelAmount 는 1원 이상이어야 합니다.")
    private Long cancelAmount;

    /** 환불 계좌 예금주명 (무통장/가상계좌 환불 시 필요) */
    @Size(max = 50, message = "refundHolderName 은 50자 이하여야 합니다.")
    private String refundHolderName;

    /** 환불 계좌 은행코드 (무통장/가상계좌 환불 시 필요) */
    @Size(max = 10, message = "refundBank 는 10자 이하여야 합니다.")
    private String refundBank;

    /** 환불 계좌번호 (무통장/가상계좌 환불 시 필요) */
    @Size(max = 30, message = "refundAccountNumber 는 30자 이하여야 합니다.")
    private String refundAccountNumber;
}
