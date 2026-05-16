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
@Table(name = "odh_order_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 상태 이력 엔티티
@Comment("주문 상태 이력")
public class OdhOrderStatusHist extends BaseEntity {

    @Id
    @Comment("주문상태이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "order_status_hist_id", length = 21, nullable = false)
    private String orderStatusHistId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("변경 전 주문상태 (코드: ORDER_STATUS)")
    @Column(name = "order_status_cd_before", length = 20)
    private String orderStatusCdBefore;

    @Comment("변경 후 주문상태 (코드: ORDER_STATUS)")
    @Column(name = "order_status_cd", length = 20)
    private String orderStatusCd;

    @Comment("상태 변경 사유")
    @Column(name = "status_reason", length = 300)
    private String statusReason;

    @Comment("변경 담당자 (sy_user.user_id, mb_member.member_id)")
    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Comment("변경 일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("메모")
    @Column(name = "memo", length = 300)
    private String memo;

}
