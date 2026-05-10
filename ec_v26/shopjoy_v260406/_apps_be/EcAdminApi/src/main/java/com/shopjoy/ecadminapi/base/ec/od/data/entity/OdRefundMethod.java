package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "od_refund_method", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 환불수단 엔티티
public class OdRefundMethod extends BaseEntity {

    @Id
    @Column(name = "refund_method_id", length = 21, nullable = false)
    private String refundMethodId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "refund_id", length = 21, nullable = false)
    private String refundId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "pay_method_cd", length = 20, nullable = false)
    private String payMethodCd;

    @Column(name = "refund_priority")
    private Integer refundPriority;

    @Column(name = "refund_amt")
    private Long refundAmt;

    @Column(name = "refund_avail_amt")
    private Long refundAvailAmt;

    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Column(name = "pay_id", length = 21)
    private String payId;

    @Column(name = "pg_refund_id", length = 100)
    private String pgRefundId;

    @Column(name = "pg_response", columnDefinition = "TEXT")
    private String pgResponse;

}
