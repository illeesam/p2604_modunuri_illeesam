package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상품권 SNS 발송 요청 DTO.
 * 사용: POST /api/bo/ec/pm/voucher/{id}/send-sns
 */
public class PmVoucherSendSnsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request {
        /** SNS 발송 채널 (KAKAO, SMS, EMAIL 등) */
        @Size(max = 30) private String channel;
        /** 수신자 식별 (전화번호 / 이메일 등) */
        @Size(max = 100) private String recipient;
        /** 추가 메시지 */
        @Size(max = 500) private String message;
    }
}
