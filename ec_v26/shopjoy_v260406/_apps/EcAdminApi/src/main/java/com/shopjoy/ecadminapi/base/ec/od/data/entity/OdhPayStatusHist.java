package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "odh_pay_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 결제 상태 이력 엔티티
public class OdhPayStatusHist {

    @Id
    @Column(name = "pay_status_hist_id", length = 21, nullable = false)
    private String payStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "pay_id", length = 21, nullable = false)
    private String payId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Column(name = "pay_status_cd", length = 20)
    private String payStatusCd;

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