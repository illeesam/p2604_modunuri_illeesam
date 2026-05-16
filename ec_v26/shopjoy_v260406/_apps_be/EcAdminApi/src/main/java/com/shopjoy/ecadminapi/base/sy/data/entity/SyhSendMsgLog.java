package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "syh_send_msg_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 메시지 발송 로그 엔티티
@Comment("메시지 발송 로그 (SMS/카카오/앱푸시)")
public class SyhSendMsgLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("발송채널 (코드: MSG_CHANNEL)")
    @Column(name = "channel_cd", length = 20, nullable = false)
    private String channelCd;

    @Comment("템플릿ID (sy_template.template_id)")
    @Column(name = "template_id", length = 21)
    private String templateId;

    @Comment("템플릿코드 스냅샷")
    @Column(name = "template_code", length = 50)
    private String templateCode;

    @Comment("대상 회원ID (ec_member.member_id, 비회원 NULL)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("대상 관리자ID (sy_user.user_id, 관리자 발송 시)")
    @Column(name = "user_id", length = 21)
    private String userId;

    @Comment("수신 전화번호 (SMS/LMS/카카오)")
    @Column(name = "recv_phone", length = 20)
    private String recvPhone;

    @Comment("디바이스 토큰 (앱 푸시)")
    @Column(name = "device_token", length = 300)
    private String deviceToken;

    @Comment("발신 번호 (SMS/LMS)")
    @Column(name = "sender_phone", length = 20)
    private String senderPhone;

    @Comment("제목 (LMS/앱 푸시)")
    @Column(name = "title", length = 200)
    private String title;

    @Comment("발송 내용 (치환 완료본)")
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Comment("치환 파라미터 JSON (예: {\"order_no\":\"...\",\"recv_nm\":\"...\"})")
    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Comment("카카오 알림톡 템플릿 코드 (카카오 채널 시)")
    @Column(name = "kakao_tpl_code", length = 50)
    private String kakaoTplCode;

    @Comment("발송결과 (코드: SEND_RESULT)")
    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Comment("통신사/카카오 응답 메시지")
    @Column(name = "result_msg", length = 200)
    private String resultMsg;

    @Comment("실패 사유")
    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("연관유형코드 (ORDER/CLAIM/JOIN/AUTH 등)")
    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

}
