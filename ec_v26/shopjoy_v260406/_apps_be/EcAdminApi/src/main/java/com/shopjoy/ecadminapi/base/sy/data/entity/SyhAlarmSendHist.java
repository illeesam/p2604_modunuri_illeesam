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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "syh_alarm_send_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 알람 발송 이력 엔티티
@Comment("알림 발송 이력")
public class SyhAlarmSendHist extends BaseEntity {

    @Id
    @Comment("발송이력ID")
    @Column(name = "send_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "sendHistId 는 21자 이내여야 합니다.")
    private String sendHistId;


    @Comment("알림ID")
    @Column(name = "alarm_id", length = 21, nullable = false)
    @Size(max = 21, message = "alarmId 는 21자 이내여야 합니다.")
    private String alarmId;

    @Comment("수신자 회원ID")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("수신자 사용자ID (sy_user.user_id)")
    @Column(name = "user_id", length = 21)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;

    @Comment("발송채널")
    @Column(name = "channel", length = 20)
    @Size(max = 20, message = "channel 는 20자 이내여야 합니다.")
    private String channel;

    @Comment("수신처 (이메일/전화/토큰)")
    @Column(name = "send_to", length = 200)
    @Size(max = 100, message = "sendTo 는 100자 이내여야 합니다.")
    private String sendTo;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("발송결과 (SENT/FAILED)")
    @Column(name = "send_hist_status_cd", length = 20)
    @Size(max = 20, message = "sendHistStatusCd 는 20자 이내여야 합니다.")
    private String sendHistStatusCd;

    @Comment("오류메시지")
    @Column(name = "error_msg", length = 500)
    @Size(max = 100, message = "errorMsg 는 100자 이내여야 합니다.")
    private String errorMsg;

}
