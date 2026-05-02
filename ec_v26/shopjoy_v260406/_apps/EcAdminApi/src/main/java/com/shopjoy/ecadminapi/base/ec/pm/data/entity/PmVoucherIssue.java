package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pm_voucher_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 바우처(상품권) 발행 이력 엔티티
public class PmVoucherIssue extends BaseEntity {

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

}
