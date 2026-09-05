package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

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
@Table(name = "cmh_push_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 푸시 발송 이력 엔티티
@Comment("푸시/알림 발송 로그")
public class CmhPushLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    @Size(max = 21, message = "logId 는 21자 이내여야 합니다.")
    private String logId;


    @Comment("발송채널 (코드: PUSH_CHANNEL)")
    @Column(name = "channel_cd", length = 20, nullable = false)
    @Size(max = 20, message = "channelCd 는 20자 이내여야 합니다.")
    private String channelCd;

    @Comment("템플릿ID (sy_template.template_id)")
    @Column(name = "template_id", length = 21)
    @Size(max = 21, message = "templateId 는 21자 이내여야 합니다.")
    private String templateId;

    @Comment("대상 회원ID")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("수신처 (이메일/전화번호/디바이스토큰)")
    @Column(name = "recv_addr", length = 200, nullable = false)
    @Size(max = 200, message = "recvAddr 는 200자 이내여야 합니다.")
    private String recvAddr;

    @Comment("발송 제목")
    @Column(name = "push_log_title", length = 200)
    @Size(max = 200, message = "pushLogTitle 는 200자 이내여야 합니다.")
    private String pushLogTitle;

    @Comment("발송 내용")
    @Column(name = "push_log_content", columnDefinition = "TEXT")
    @Size(max = 50000, message = "pushLogContent 는 50000자 이내여야 합니다.")
    private String pushLogContent;

    @Comment("발송결과 (코드: PUSH_RESULT)")
    @Column(name = "result_cd", length = 20)
    @Size(max = 20, message = "resultCd 는 20자 이내여야 합니다.")
    private String resultCd;

    @Comment("실패 사유")
    @Column(name = "fail_reason", length = 500)
    @Size(max = 500, message = "failReason 는 500자 이내여야 합니다.")
    private String failReason;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("연관유형코드 (ORDER/CLAIM/EVENT 등)")
    @Column(name = "ref_type_cd", length = 30)
    @Size(max = 30, message = "refTypeCd 는 30자 이내여야 합니다.")
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    @Size(max = 21, message = "refId 는 21자 이내여야 합니다.")
    private String refId;

}
