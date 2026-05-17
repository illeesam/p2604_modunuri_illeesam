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
@Table(name = "odh_order_item_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 아이템 변경 이력 엔티티
@Comment("주문 품목 변경 이력")
public class OdhOrderItemChgHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "order_item_chg_hist_id", length = 21, nullable = false)
    private String orderItemChgHistId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("주문품목ID (od_order_item.)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Comment("변경유형코드 (QTY/PRICE/OPT/STATUS/AMOUNT/COUPON)")
    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Comment("변경 필드명")
    @Column(name = "chg_field", length = 50)
    private String chgField;

    @Comment("변경전값")
    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Comment("변경후값")
    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 300)
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
