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
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_order_discnt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 할인 엔티티
@Comment("주문할인·차감 내역 (주문쿠폰·적립금·캐쉬)")
public class OdOrderDiscnt extends BaseEntity {

    @Id
    @Comment("주문할인ID (YYMMDDhhmmss+rand4)")
    @Column(name = "order_discnt_id", length = 21, nullable = false)
    private String orderDiscntId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("할인유형코드 (코드: ORDER_DISCNT_TYPE — ORDER_COUPON/SAVE_USE/CACHE_USE/SHIP_DISCNT/PROMO_DISCNT)")
    @Column(name = "discnt_type_cd", length = 30, nullable = false)
    private String discntTypeCd;

    @Comment("쿠폰ID (pm_coupon.coupon_id — ORDER_COUPON인 경우)")
    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Comment("쿠폰발급ID (pm_coupon_issue.coupon_issue_id — ORDER_COUPON인 경우)")
    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Comment("할인율 (% — 비율할인인 경우)")
    @Column(name = "discnt_rate")
    private BigDecimal discntRate;

    @Comment("할인·차감 금액")
    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Comment("안분 기준 상품금액 (주문쿠폰 안분 계산용 — 쿠폰 적용 대상 items 합계)")
    @Column(name = "base_item_amt")
    private Long baseItemAmt;

    @Comment("복원여부 Y/N (환불 시 적립금·캐쉬 차감 복원 완료 여부)")
    @Column(name = "restore_yn", length = 1)
    private String restoreYn;

    @Comment("복원된 금액 (부분반품 시 부분복원 지원)")
    @Column(name = "restore_amt")
    private Long restoreAmt;

    @Comment("복원 처리일시")
    @Column(name = "restore_date")
    private LocalDateTime restoreDate;

}
