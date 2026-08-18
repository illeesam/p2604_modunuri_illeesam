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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_coupon_issue", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 쿠폰 발행 엔티티
@Comment("쿠폰 발급")
public class PmCouponIssue extends BaseEntity {

    @Id
    @Comment("발급ID")
    @Column(name = "coupon_issue_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponIssueId 는 21자 이내여야 합니다.")
    private String couponIssueId;


    @Comment("쿠폰ID")
    @Column(name = "coupon_id", length = 21, nullable = false)
    @Size(max = 21, message = "couponId 는 21자 이내여야 합니다.")
    private String couponId;

    @Comment("회원ID")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("발급일시")
    @Column(name = "issue_date")
    private LocalDateTime issueDate;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("사용일시")
    @Column(name = "use_date")
    private LocalDateTime useDate;

    @Comment("사용주문ID")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

}
