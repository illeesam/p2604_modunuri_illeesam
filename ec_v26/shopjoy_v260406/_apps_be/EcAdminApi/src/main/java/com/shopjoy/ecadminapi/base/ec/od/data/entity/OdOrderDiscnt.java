package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_order_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 할인 엔티티
public class OdOrderDiscnt extends BaseEntity {

    @Id
    @Column(name = "order_discnt_id", length = 21, nullable = false)
    private String orderDiscntId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "discnt_type_cd", length = 30, nullable = false)
    private String discntTypeCd;

    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Column(name = "discnt_rate")
    private BigDecimal discntRate;

    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Column(name = "base_item_amt")
    private Long baseItemAmt;

    @Column(name = "restore_yn", length = 1)
    private String restoreYn;

    @Column(name = "restore_amt")
    private Long restoreAmt;

    @Column(name = "restore_date")
    private LocalDateTime restoreDate;

}
