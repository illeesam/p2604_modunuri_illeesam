package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 발송 결과 VO (메일/카카오/SMS/시스템알림 공통, co 레이어).
 *
 * <p>채널별 발송 서비스가 발송 시도 후 반환한다. 성공 여부 + 저장된 이력 로그ID +
 * 실패 사유를 담는다. 오케스트레이터(CmMsgSendService)가 이를 모아 종합 결과를 만든다.</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작.</p>
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SendResultVo {

    /** 발송 채널 (EMAIL/KAKAO/SMS/SYSTEM). */
    private String channel;

    /** 발송 성공 여부. */
    private Boolean success;

    /** 발송결과 코드 (SEND_RESULT: SUCCESS/FAILED/PENDING). */
    private String resultCd;

    /** 저장된 이력 로그ID (email_log.log_id / msg_log.log_id / alarm_send_hist.send_hist_id). */
    private String logId;

    /** 실패 사유 (성공 시 null). */
    private String failReason;
}
