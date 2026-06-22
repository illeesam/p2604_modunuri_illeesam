package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 토스페이먼츠 결제 승인(confirm) 요청 VO.
 * sy_prop 키: app.pay.toss.secret-key / app.pay.toss.confirm-url
 */
@Data
public class PayTossConfirmReq {

    @NotBlank(message = "paymentKey 가 필요합니다.")
    private String paymentKey;

    @NotBlank(message = "orderId 가 필요합니다.")
    private String orderId;

    @NotNull(message = "amount 가 필요합니다.")
    private Long amount;
}
