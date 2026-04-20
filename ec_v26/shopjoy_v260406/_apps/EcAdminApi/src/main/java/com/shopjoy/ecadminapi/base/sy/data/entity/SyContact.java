package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_contact", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 문의 엔티티
public class SyContact {

    @Id
    @Column(name = "contact_id", length = 21, nullable = false)
    private String contactId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "member_nm", length = 50)
    private String memberNm;

    @Column(name = "category_cd", length = 30)
    private String categoryCd;

    @Column(name = "contact_title", length = 200, nullable = false)
    private String contactTitle;

    @Lob
    @Column(name = "contact_content", columnDefinition = "TEXT")
    private String contactContent;

    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Column(name = "contact_status_cd", length = 20)
    private String contactStatusCd;

    @Lob
    @Column(name = "contact_answer", columnDefinition = "TEXT")
    private String contactAnswer;

    @Column(name = "answer_user_id", length = 21)
    private String answerUserId;

    @Column(name = "answer_date")
    private LocalDateTime answerDate;

    @Column(name = "contact_date")
    private LocalDateTime contactDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}