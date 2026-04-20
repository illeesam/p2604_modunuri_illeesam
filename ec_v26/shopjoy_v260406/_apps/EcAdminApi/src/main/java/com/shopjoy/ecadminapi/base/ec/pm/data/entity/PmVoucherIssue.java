package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_voucher_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 바우처(상품권) 발행 이력 엔티티
public class PmVoucherIssue {

    @Id
    @Column(name = "voucher_issue_id", length = 21, nullable = false)
    private String voucherIssueId;

    @Column(name = "voucher_id", length = 21, nullable = false)
    private String voucherId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "voucher_code", length = 50, nullable = false)
    private String voucherCode;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "expire_date")
    private LocalDateTime expireDate;

    @Column(name = "use_date")
    private LocalDateTime useDate;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "use_amt")
    private Long useAmt;

    @Column(name = "voucher_issue_status_cd", length = 20)
    private String voucherIssueStatusCd;

    @Column(name = "voucher_issue_status_cd_before", length = 20)
    private String voucherIssueStatusCdBefore;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}