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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "odh_order_item_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 아이템 상태 이력 엔티티
@Comment("주문상품 상태 이력")
public class OdhOrderItemStatusHist extends BaseEntity {

    @Id
    @Comment("주문상품상태이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "order_item_status_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderItemStatusHistId 는 21자 이내여야 합니다.")
    private String orderItemStatusHistId;


    @Comment("주문상품ID (od_order_item.order_item_id)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("변경 전 주문상품상태 (코드: ORDER_ITEM_STATUS_CD)")
    @Column(name = "order_item_status_cd_before", length = 20)
    @Size(max = 20, message = "orderItemStatusCdBefore 는 20자 이내여야 합니다.")
    private String orderItemStatusCdBefore;

    @Comment("변경 후 주문상품상태 (코드: ORDER_ITEM_STATUS_CD)")
    @Column(name = "order_item_status_cd", length = 20)
    @Size(max = 20, message = "orderItemStatusCd 는 20자 이내여야 합니다.")
    private String orderItemStatusCd;

    @Comment("상태 변경 사유")
    @Column(name = "status_reason", length = 300)
    @Size(max = 100, message = "statusReason 는 100자 이내여야 합니다.")
    private String statusReason;

    @Comment("변경 담당자 (sy_user.user_id, mb_member.member_id)")
    @Column(name = "chg_user_id", length = 21)
    @Size(max = 21, message = "chgUserId 는 21자 이내여야 합니다.")
    private String chgUserId;

    @Comment("변경 일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    @Size(max = 100, message = "memo 는 100자 이내여야 합니다.")
    private String memo;

}
