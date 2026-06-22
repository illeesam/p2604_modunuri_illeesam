package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 토스페이먼츠 결제 취소/부분환불(cancel) 요청 VO.
 * sy_prop 키: app.pay.toss.secret-key / app.pay.toss.cancel-url-base
 */
@Data
public class PayTossCancelReq {

    @NotBlank(message = "paymentKey 가 필요합니다.")
    private String paymentKey;

    @NotBlank(message = "cancelReason 이 필요합니다.")
    private String cancelReason;

    /** null 이면 전체취소, 값 있으면 부분환불 */
    private Long cancelAmount;
}
