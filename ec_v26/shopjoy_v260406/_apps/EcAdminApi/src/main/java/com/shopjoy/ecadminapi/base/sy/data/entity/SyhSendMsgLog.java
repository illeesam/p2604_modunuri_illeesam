package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "syh_send_msg_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 메시지 발송 로그 엔티티
public class SyhSendMsgLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "channel_cd", length = 20, nullable = false)
    private String channelCd;

    @Column(name = "template_id", length = 21)
    private String templateId;

    @Column(name = "template_code", length = 50)
    private String templateCode;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "user_id", length = 21)
    private String userId;

    @Column(name = "recv_phone", length = 20)
    private String recvPhone;

    @Column(name = "device_token", length = 300)
    private String deviceToken;

    @Column(name = "sender_phone", length = 20)
    private String senderPhone;

    @Column(name = "title", length = 200)
    private String title;

    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Column(name = "kakao_tpl_code", length = 50)
    private String kakaoTplCode;

    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Column(name = "result_msg", length = 200)
    private String resultMsg;

    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

}
