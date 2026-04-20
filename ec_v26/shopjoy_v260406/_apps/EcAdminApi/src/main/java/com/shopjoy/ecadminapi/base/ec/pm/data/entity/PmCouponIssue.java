package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_coupon_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 쿠폰 발행 엔티티
public class PmCouponIssue {

    @Id
    @Column(name = "issue_id", length = 21, nullable = false)
    private String issueId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "use_date")
    private LocalDateTime useDate;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}