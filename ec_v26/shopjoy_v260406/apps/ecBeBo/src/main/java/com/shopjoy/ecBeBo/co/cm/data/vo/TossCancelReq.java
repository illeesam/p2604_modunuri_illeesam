package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 토스 결제 취소/부분환불(cancel) 요청 VO.
 *
 * <p>흐름: 승인 완료된 결제 건을 취소한다. 서버는 시크릿키 Basic 인증으로
 * 토스 결제취소 API(https://api.tosspayments.com/v1/payments/{paymentKey}/cancel)에
 * cancelReason(필수), cancelAmount(선택) 을 전달한다.
 * cancelAmount 가 없으면 전체취소, 있으면 해당 금액만 부분환불한다.
 * (취소는 반드시 서버에서, 시크릿키 노출 방지)</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작. 검증은 컨트롤러 @Valid 로 수행.</p>
 */
@Data
public class TossCancelReq {

    /** 취소할 결제 건의 고유 키. 승인 시 토스가 발급한 paymentKey (필수). */
    @NotBlank(message = "paymentKey 가 필요합니다.")
    private String paymentKey;

    /** 취소 사유. 토스가 취소 내역에 기록함 (필수). */
    @NotBlank(message = "cancelReason 이 필요합니다.")
    private String cancelReason;

    /**
     * 취소 금액(원). null 이면 전체취소, 값이 있으면 해당 금액만 부분환불.
     * 부분취소 잔액이 남으면 추가 부분취소 가능. (선택 — 검증 없음, null 시작)
     */
    private Long cancelAmount;
}
