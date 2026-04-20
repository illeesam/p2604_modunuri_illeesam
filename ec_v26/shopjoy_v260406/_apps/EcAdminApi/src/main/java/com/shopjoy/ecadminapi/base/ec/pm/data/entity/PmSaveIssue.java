package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_save_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 적립금 지급 이력 엔티티
public class PmSaveIssue {

    @Id
    @Column(name = "save_issue_id", length = 21, nullable = false)
    private String saveIssueId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "save_issue_type_cd", length = 20, nullable = false)
    private String saveIssueTypeCd;

    @Column(name = "save_amt", nullable = false)
    private Long saveAmt;

    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Column(name = "ref_type_cd", length = 20)
    private String refTypeCd;

    @Column(name = "ref_id", length = 21)
    private String refId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Column(name = "issue_status_cd", length = 20)
    private String issueStatusCd;

    @Column(name = "issue_status_cd_before", length = 20)
    private String issueStatusCdBefore;

    @Column(name = "save_memo", length = 300)
    private String saveMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}