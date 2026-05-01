package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "odh_order_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 주문 상태 이력 엔티티
public class OdhOrderStatusHist {

    @Id
    @Column(name = "order_status_hist_id", length = 21, nullable = false)
    private String orderStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "order_status_cd_before", length = 20)
    private String orderStatusCdBefore;

    @Column(name = "order_status_cd", length = 20)
    private String orderStatusCd;

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