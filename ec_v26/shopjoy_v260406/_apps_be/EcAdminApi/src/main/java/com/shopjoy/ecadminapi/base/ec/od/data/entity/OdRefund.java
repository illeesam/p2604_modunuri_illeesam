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
@Table(name = "od_refund", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 환불 엔티티
public class OdRefund extends BaseEntity {

    @Id
    @Column(name = "refund_id", length = 21, nullable = false)
    private String refundId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Column(name = "refund_type_cd", length = 20, nullable = false)
    private String refundTypeCd;

    @Column(name = "refund_prod_amt")
    private Long refundProdAmt;

    @Column(name = "refund_coupon_amt")
    private Long refundCouponAmt;

    @Column(name = "refund_ship_amt")
    private Long refundShipAmt;

    @Column(name = "refund_save_amt")
    private Long refundSaveAmt;

    @Column(name = "refund_cache_amt")
    private Long refundCacheAmt;

    @Column(name = "total_refund_amt")
    private Long totalRefundAmt;

    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Column(name = "refund_req_date")
    private LocalDateTime refundReqDate;

    @Column(name = "refund_complt_date")
    private LocalDateTime refundCompltDate;

    @Column(name = "fault_type_cd", length = 20)
    private String faultTypeCd;

    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @Column(name = "memo", length = 300)
    private String memo;

}
