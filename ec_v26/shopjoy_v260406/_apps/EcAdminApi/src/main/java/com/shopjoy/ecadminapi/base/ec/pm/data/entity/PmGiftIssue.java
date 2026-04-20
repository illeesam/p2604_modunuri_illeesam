package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_gift_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 사은품 발행 이력 엔티티
public class PmGiftIssue {

    @Id
    @Column(name = "gift_issue_id", length = 21, nullable = false)
    private String giftIssueId;

    @Column(name = "gift_id", length = 21, nullable = false)
    private String giftId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "gift_issue_status_cd", length = 20)
    private String giftIssueStatusCd;

    @Column(name = "gift_issue_status_cd_before", length = 20)
    private String giftIssueStatusCdBefore;

    @Lob
    @Column(name = "gift_issue_memo", columnDefinition = "TEXT")
    private String giftIssueMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}