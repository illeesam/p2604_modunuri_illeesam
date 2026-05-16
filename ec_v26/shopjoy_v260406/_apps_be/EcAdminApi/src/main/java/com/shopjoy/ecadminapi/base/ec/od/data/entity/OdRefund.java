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
@Table(name = "od_refund", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 환불 엔티티
@Comment("환불 마스터 (클레임 건별 환불 총괄)")
public class OdRefund extends BaseEntity {

    @Id
    @Comment("환불ID (YYMMDDhhmmss+rand4)")
    @Column(name = "refund_id", length = 21, nullable = false)
    private String refundId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("클레임ID (od_claim.claim_id)")
    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Comment("환불유형코드 (코드: REFUND_TYPE — CANCEL/RETURN/PARTIAL/EXTRA)")
    @Column(name = "refund_type_cd", length = 20, nullable = false)
    private String refundTypeCd;

    @Comment("환불 상품금액 (주문쿠폰 안분 차감 후 실환불 대상액)")
    @Column(name = "refund_prod_amt")
    private Long refundProdAmt;

    @Comment("주문쿠폰 안분 차감액 (환불 불가 — 쿠폰 재발급 또는 소멸)")
    @Column(name = "refund_coupon_amt")
    private Long refundCouponAmt;

    @Comment("환불 배송비 (음수이면 추가청구)")
    @Column(name = "refund_ship_amt")
    private Long refundShipAmt;

    @Comment("적립금 복원금액 (od_order_discnt.SAVE_USE 기준)")
    @Column(name = "refund_save_amt")
    private Long refundSaveAmt;

    @Comment("캐쉬 복원금액 (od_order_discnt.CACHE_USE 기준)")
    @Column(name = "refund_cache_amt")
    private Long refundCacheAmt;

    @Comment("총 환불금액 (실결제 수단으로 돌려주는 합계)")
    @Column(name = "total_refund_amt")
    private Long totalRefundAmt;

    @Comment("환불상태 (코드: REFUND_STATUS — PENDING/COMPLT/FAILED/PARTIAL)")
    @Column(name = "refund_status_cd", length = 20)
    private String refundStatusCd;

    @Comment("변경 전 환불상태 (코드: REFUND_STATUS)")
    @Column(name = "refund_status_cd_before", length = 20)
    private String refundStatusCdBefore;

    @Comment("환불 요청일시")
    @Column(name = "refund_req_date")
    private LocalDateTime refundReqDate;

    @Comment("환불 완료일시")
    @Column(name = "refund_complt_date")
    private LocalDateTime refundCompltDate;

    @Comment("귀책유형코드 (코드: CLAIM_FAULT — CUST/VENDOR/PLATFORM)")
    @Column(name = "fault_type_cd", length = 20)
    private String faultTypeCd;

    @Comment("환불 사유")
    @Column(name = "refund_reason", length = 500)
    private String refundReason;

    @Comment("관리 메모")
    @Column(name = "memo", length = 300)
    private String memo;

}
