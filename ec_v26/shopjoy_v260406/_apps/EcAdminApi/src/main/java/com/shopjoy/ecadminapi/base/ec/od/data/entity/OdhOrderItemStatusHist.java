package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "odh_order_item_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 주문 아이템 상태 이력 엔티티
public class OdhOrderItemStatusHist {

    @Id
    @Column(name = "order_item_status_hist_id", length = 21, nullable = false)
    private String orderItemStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "order_item_status_cd_before", length = 20)
    private String orderItemStatusCdBefore;

    @Column(name = "order_item_status_cd", length = 20)
    private String orderItemStatusCd;

    @Column(name = "status_reason", length = 300)
    private String statusReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "memo", length = 300)
    private String memo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}