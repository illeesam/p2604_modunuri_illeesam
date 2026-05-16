package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

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
@Table(name = "pm_discnt_usage", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 할인 사용 이력 엔티티
@Comment("할인 적용 이력 (주문 시 적용된 할인정책 건별 기록)")
public class PmDiscntUsage extends BaseEntity {

    @Id
    @Comment("할인사용ID (YYMMDDhhmmss+rand4)")
    @Column(name = "discnt_usage_id", length = 21, nullable = false)
    private String discntUsageId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("할인ID (pm_discnt.discnt_id)")
    @Column(name = "discnt_id", length = 21, nullable = false)
    private String discntId;

    @Comment("할인명 스냅샷")
    @Column(name = "discnt_nm", length = 100)
    private String discntNm;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    private String orderId;

    @Comment("주문상품ID (od_order_item.order_item_id, 상품별 할인 적용 시)")
    @Column(name = "order_item_id", length = 21)
    private String orderItemId;

    @Comment("상품ID (pd_prod.prod_id, 할인 적용 상품)")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("할인유형 스냅샷 (RATE=정률 / FIXED=정액 / FREE_SHIP=무료배송)")
    @Column(name = "discnt_type_cd", length = 20)
    private String discntTypeCd;

    @Comment("할인값 스냅샷 (정률이면 % / 정액이면 원)")
    @Column(name = "discnt_value")
    private BigDecimal discntValue;

    @Comment("실할인금액")
    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Comment("적용일시")
    @Column(name = "used_date")
    private LocalDateTime usedDate;

}
