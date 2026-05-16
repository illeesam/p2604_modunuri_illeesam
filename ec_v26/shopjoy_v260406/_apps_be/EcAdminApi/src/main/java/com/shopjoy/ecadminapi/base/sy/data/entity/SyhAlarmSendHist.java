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
@Table(name = "syh_alarm_send_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 알람 발송 이력 엔티티
@Comment("알림 발송 이력")
public class SyhAlarmSendHist extends BaseEntity {

    @Id
    @Comment("발송이력ID")
    @Column(name = "send_hist_id", length = 21, nullable = false)
    private String sendHistId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("알림ID")
    @Column(name = "alarm_id", length = 21, nullable = false)
    private String alarmId;

    @Comment("수신자 회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("발송채널")
    @Column(name = "channel", length = 20)
    private String channel;

    @Comment("수신처 (이메일/전화/토큰)")
    @Column(name = "send_to", length = 200)
    private String sendTo;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("발송결과 (SENT/FAILED)")
    @Column(name = "send_hist_status_cd", length = 20)
    private String sendHistStatusCd;

    @Comment("오류메시지")
    @Column(name = "error_msg", length = 500)
    private String errorMsg;

}
