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
@Table(name = "pm_coupon_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 발행 엔티티
public class PmCouponIssue extends BaseEntity {

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

}
