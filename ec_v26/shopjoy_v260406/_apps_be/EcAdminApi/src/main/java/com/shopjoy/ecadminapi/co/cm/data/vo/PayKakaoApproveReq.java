package com.shopjoy.ecadminapi.co.cm.data.vo;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 카카오페이 결제 승인(approve) 요청 VO.
 *
 * POST https://open-api.kakaopay.com/online/v1/payment/approve
 * ready 응답의 tid + pg_token(approvalUrl 리다이렉트 파라미터) 으로 승인.
 */
@Data
public class PayKakaoApproveReq {

    /** ready 응답에서 받은 결제 고유 번호 (필수) */
    @NotBlank(message = "tid 가 필요합니다.")
    private String tid;

    /** ready 요청 시 사용한 가맹점 주문 번호 (필수) */
    @NotBlank(message = "partnerOrderId 가 필요합니다.")
    private String partnerOrderId;

    /** ready 요청 시 사용한 가맹점 회원 ID (필수) */
    @NotBlank(message = "partnerUserId 가 필요합니다.")
    private String partnerUserId;

    /** approvalUrl 리다이렉트 시 쿼리 파라미터로 전달되는 결제 승인 토큰 (필수) */
    @NotBlank(message = "pgToken 이 필요합니다.")
    private String pgToken;
}
