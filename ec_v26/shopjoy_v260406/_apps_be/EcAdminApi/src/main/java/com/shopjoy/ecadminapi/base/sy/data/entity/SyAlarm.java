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
@Table(name = "sy_alarm", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 알람 엔티티
@Comment("알림")
public class SyAlarm extends BaseEntity {

    @Id
    @Comment("알림ID (YYMMDDhhmmss+rand4)")
    @Column(name = "alarm_id", length = 21, nullable = false)
    private String alarmId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("알림제목")
    @Column(name = "alarm_title", length = 200, nullable = false)
    private String alarmTitle;

    @Comment("알림유형 (코드: ALARM_TYPE)")
    @Column(name = "alarm_type_cd", length = 30)
    private String alarmTypeCd;

    @Comment("발송채널 (코드: ALARM_CHANNEL)")
    @Column(name = "channel_cd", length = 20)
    private String channelCd;

    @Comment("대상유형 (코드: ALARM_TARGET_TYPE — ALL/GRADE/MEMBER)")
    @Column(name = "target_type_cd", length = 20)
    private String targetTypeCd;

    @Comment("대상ID (회원ID 또는 등급코드)")
    @Column(name = "target_id", length = 21)
    private String targetId;

    @Comment("템플릿ID")
    @Column(name = "template_id", length = 21)
    private String templateId;

    @Comment("발송내용")
    @Column(name = "alarm_msg", columnDefinition = "TEXT")
    private String alarmMsg;

    @Comment("발송예정일시")
    @Column(name = "alarm_send_date")
    private LocalDateTime alarmSendDate;

    @Comment("발송상태 (PENDING/SENT/FAILED/CANCELLED)")
    @Column(name = "alarm_status_cd", length = 20)
    private String alarmStatusCd;

    @Comment("발송성공수")
    @Column(name = "alarm_send_count")
    private Integer alarmSendCount;

    @Comment("발송실패수")
    @Column(name = "alarm_fail_count")
    private Integer alarmFailCount;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
