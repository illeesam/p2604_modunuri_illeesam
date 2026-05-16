package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_coupon_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 발행 엔티티
@Comment("쿠폰 발급")
public class PmCouponIssue extends BaseEntity {

    @Id
    @Comment("발급ID")
    @Column(name = "issue_id", length = 21, nullable = false)
    private String issueId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("쿠폰ID")
    @Column(name = "coupon_id", length = 21, nullable = false)
    private String couponId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("발급일시")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("사용일시")
    @Column(name = "use_date")
    private LocalDateTime useDate;

    @Comment("사용주문ID")
    @Column(name = "order_id", length = 21)
    private String orderId;

}
