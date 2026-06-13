package com.shopjoy.ecadminapi.co.cm.data.vo;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

/**
 * 메시지 발송 요청 VO (BO/FO 공통, co 레이어).
 *
 * <p>채널별 발송 컨트롤러(CmMsgSendController)가 수동/테스트 발송 시 사용한다.
 * 채널마다 필요한 필드만 채워 보낸다(미사용 필드 null).</p>
 *
 * <p>필드 default 금지 정책: 모든 필드 null 시작.</p>
 */
@Getter
@Setter
@NoArgsConstructor
public class MsgSendReq {

    /** 사이트ID (null 이면 대표 사이트). */
    private String siteId;

    /** 템플릿코드 (있으면 sy_template 조회·치환, 없으면 subject/content 직접). */
    private String templateCode;

    /** 수신 이메일 (메일 채널). */
    private String toAddr;

    /** 수신 전화번호 (카카오/SMS 채널). */
    private String recvPhone;

    /** 발신 번호 (SMS 채널). */
    private String senderPhone;

    /** 제목 (메일/SMS/시스템알림). */
    private String subject;

    /** 본문 (치환 전 또는 직접). */
    private String content;

    /** 카카오 알림톡 템플릿 코드. */
    private String kakaoTplCode;

    /** 시스템알림 유형코드 (ALARM_TYPE). */
    private String alarmTypeCd;

    /** 대상 회원ID (시스템알림/이력 기록용). */
    private String memberId;

    /** 수신처 표기 (시스템알림 send_to). */
    private String sendTo;

    /** 연관 유형코드 (ORDER/CLAIM/CONTACT 등). */
    private String refTypeCd;

    /** 연관 ID. */
    private String refId;

    /** 치환 파라미터 ({key} → value). */
    private Map<String, Object> params;
}
