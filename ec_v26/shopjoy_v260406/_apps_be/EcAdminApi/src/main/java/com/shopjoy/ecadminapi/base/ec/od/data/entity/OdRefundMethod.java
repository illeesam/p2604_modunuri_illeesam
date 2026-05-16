package com.shopjoy.ecadminapi.base.ec.od.data.entity;

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
@Table(name = "od_refund_method", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 환불수단 엔티티
@Comment("환불수단 내역 (수단별 환불금액 및 우선순위)")
public class OdRefundMethod extends BaseEntity {

    @Id
    @Comment("환불수단ID (YYMMDDhhmmss+rand4)")
    @Column(name = "refund_method_id", length = 21, nullable = false)
    private String refundMethodId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("환불ID (od_refund.refund_id)")
    @Column(name = "refund_id", length = 21, nullable = false)
    private String refundId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("결제수단코드 (코드: PAY_METHOD — BANK_TRANSFER/VBANK/TOSS/KAKAO/NAVER/MOBILE/CACHE/SAVE)")
    @Column(name = "pay_method_cd", length = 20, nullable = false)
    private String payMethodCd;

    @Comment("환불 우선순위 (1=카드·현금성 결제수단, 2=캐쉬, 3=적립금)")
    @Column(name = "refund_priority")
    private Integer refundPriority;

    @Comment("해당 수단으로 환불할 금액")
    @Column(name = "refund_amt")
    private Long refundAmt;

    @Comment("해당 수단 잔여 환불 가능금액 (원 결제액 - 기환불 누적액)")
    @Column(name = "refund_avail_amt")
    private Long refundAvailAmt;

    @Comment("수단별 환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED)")
    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Comment("변경 전 환불상태 (코드: REFUND_STATUS)")
    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Comment("해당 수단 환불 완료일시")
    @Column(name = "refund_date")
    private LocalDateTime refundDate;

    @Comment("원 결제 레코드ID (od_pay.pay_id)")
    @Column(name = "pay_id", length = 21)
    private String payId;

    @Comment("PG 환불 거래ID")
    @Column(name = "pg_refund_id", length = 100)
    private String pgRefundId;

    @Comment("PG 환불 응답 JSON")
    @Column(name = "pg_response", columnDefinition = "TEXT")
    private String pgResponse;

}
