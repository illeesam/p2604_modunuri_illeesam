package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 토스 결제 승인(confirm) 요청 VO.
 *
 * <p>흐름: 클라이언트(브라우저/앱)가 Toss Payments SDK 결제창에서 인증을 완료하면
 * successUrl 로 paymentKey / orderId / amount 3개 값이 전달된다.
 * 클라이언트는 이 3개 값을 그대로 서버로 보내고, 서버는 시크릿키 Basic 인증으로
 * 토스 결제승인 API(https://api.tosspayments.com/v1/payments/confirm)에 호출하여
 * 최종 승인 처리한다. (승인은 반드시 서버에서, 시크릿키 노출 방지)</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작. 검증은 컨트롤러 @Valid 로 수행.</p>
 */
@Data
public class TossConfirmReq {

    /** 결제 건의 고유 키. Toss 결제창 성공 콜백(successUrl)에서 전달됨 (필수). */
    @NotBlank(message = "paymentKey 가 필요합니다.")
    private String paymentKey;

    /** 가맹점이 생성한 주문번호. 결제 요청 시 사용한 orderId 와 동일해야 함 (필수). */
    @NotBlank(message = "orderId 가 필요합니다.")
    private String orderId;

    /** 결제 금액(원). 결제 요청 금액과 일치해야 토스가 승인함 (필수). */
    @NotNull(message = "amount 가 필요합니다.")
    private Long amount;
}
