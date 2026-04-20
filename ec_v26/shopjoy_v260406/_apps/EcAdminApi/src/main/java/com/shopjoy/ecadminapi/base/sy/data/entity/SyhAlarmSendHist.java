package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "syh_alarm_send_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 알람 발송 이력 엔티티
public class SyhAlarmSendHist {

    @Id
    @Column(name = "send_hist_id", length = 21, nullable = false)
    private String sendHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "alarm_id", length = 21, nullable = false)
    private String alarmId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "channel", length = 20)
    private String channel;

    @Column(name = "send_to", length = 200)
    private String sendTo;

    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Column(name = "send_hist_status_cd", length = 20)
    private String sendHistStatusCd;

    @Column(name = "error_msg", length = 500)
    private String errorMsg;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}