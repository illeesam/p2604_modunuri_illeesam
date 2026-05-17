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
@Table(name = "sy_contact", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 문의 엔티티
@Comment("고객문의")
public class SyContact extends BaseEntity {

    @Id
    @Comment("문의ID (YYMMDDhhmmss+rand4)")
    @Column(name = "contact_id", length = 21, nullable = false)
    private String contactId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("문의자명")
    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Comment("문의유형")
    @Column(name = "category_cd", length = 30)
    private String categoryCd;

    @Comment("제목")
    @Column(name = "contact_title", length = 200, nullable = false)
    private String contactTitle;

    @Comment("문의내용")
    @Column(name = "contact_content", columnDefinition = "TEXT")
    private String contactContent;

    @Comment("첨부파일그룹ID")
    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Comment("처리상태 (코드: CONTACT_STATUS)")
    @Column(name = "contact_status_cd", length = 20)
    private String contactStatusCd;

    @Comment("답변내용")
    @Column(name = "contact_answer", columnDefinition = "TEXT")
    private String contactAnswer;

    @Comment("답변자 (sy_user.user_id)")
    @Column(name = "answer_user_id", length = 21)
    private String answerUserId;

    @Comment("답변일시")
    @Column(name = "answer_date")
    private LocalDateTime answerDate;

    @Comment("문의일시")
    @Column(name = "contact_date")
    private LocalDateTime contactDate;

}
