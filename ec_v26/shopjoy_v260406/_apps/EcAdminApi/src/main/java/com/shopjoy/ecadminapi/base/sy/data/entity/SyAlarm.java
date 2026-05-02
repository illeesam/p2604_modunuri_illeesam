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
@Table(name = "sy_alarm", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 알람 엔티티
public class SyAlarm extends BaseEntity {

    @Id
    @Column(name = "alarm_id", length = 21, nullable = false)
    private String alarmId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "alarm_title", length = 200, nullable = false)
    private String alarmTitle;

    @Column(name = "alarm_type_cd", length = 30)
    private String alarmTypeCd;

    @Column(name = "channel_cd", length = 20)
    private String channelCd;

    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Column(name = "target_id", length = 21)
    private String targetId;

    @Column(name = "template_id", length = 21)
    private String templateId;

    @Column(name = "alarm_msg", columnDefinition = "TEXT")
    private String alarmMsg;

    @Column(name = "alarm_send_date")
    private LocalDateTime alarmSendDate;

    @Column(name = "alarm_status_cd", length = 20)
    private String alarmStatusCd;

    @Column(name = "alarm_send_count")
    private Integer alarmSendCount;

    @Column(name = "alarm_fail_count")
    private Integer alarmFailCount;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

}
