package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cmh_push_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 푸시 발송 이력 엔티티
public class CmhPushLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "channel_cd", length = 20, nullable = false)
    private String channelCd;

    @Column(name = "template_id", length = 21)
    private String templateId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "recv_addr", length = 200, nullable = false)
    private String recvAddr;

    @Column(name = "push_log_title", length = 200)
    private String pushLogTitle;

    @Column(name = "push_log_content", columnDefinition = "TEXT")
    private String pushLogContent;

    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

}
