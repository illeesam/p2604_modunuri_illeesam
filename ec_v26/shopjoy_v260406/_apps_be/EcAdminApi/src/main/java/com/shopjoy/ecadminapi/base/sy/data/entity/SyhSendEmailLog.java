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
@Table(name = "syh_send_email_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 이메일 발송 로그 엔티티
@Comment("이메일 발송 로그")
public class SyhSendEmailLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

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

    @Comment("발신 이메일")
    @Column(name = "from_addr", length = 200, nullable = false)
    private String fromAddr;

    @Comment("수신 이메일")
    @Column(name = "to_addr", length = 200, nullable = false)
    private String toAddr;

    @Comment("참조 이메일 (복수 시 콤마 구분)")
    @Column(name = "cc_addr", length = 500)
    private String ccAddr;

    @Comment("숨은참조 이메일")
    @Column(name = "bcc_addr", length = 500)
    private String bccAddr;

    @Comment("발송 제목 (치환 완료본)")
    @Column(name = "subject", length = 300, nullable = false)
    private String subject;

    @Comment("발송 본문 (치환 완료본 HTML)")
    @Column(name = "content", columnDefinition = "TEXT")
    private String content;

    @Comment("치환 파라미터 JSON (예: {\"order_no\":\"...\",\"member_nm\":\"...\"})")
    @Column(name = "params", columnDefinition = "TEXT")
    private String params;

    @Comment("발송결과 (코드: SEND_RESULT)")
    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Comment("실패 사유")
    @Column(name = "fail_reason", length = 500)
    private String failReason;

    @Comment("발송일시")
    @Column(name = "send_date")
    private LocalDateTime sendDate;

    @Comment("연관유형코드 (ORDER/CLAIM/JOIN/PWD_RESET 등)")
    @Column(name = "ref_type_cd", length = 30)
    private String refTypeCd;

    @Comment("연관ID")
    @Column(name = "ref_id", length = 21)
    private String refId;

}
