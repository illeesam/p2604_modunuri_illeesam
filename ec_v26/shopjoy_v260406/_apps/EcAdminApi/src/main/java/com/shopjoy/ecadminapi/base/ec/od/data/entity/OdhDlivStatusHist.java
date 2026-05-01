package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "odh_dliv_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배송 상태 이력 엔티티
public class OdhDlivStatusHist {

    @Id
    @Column(name = "dliv_status_hist_id", length = 21, nullable = false)
    private String dlivStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "dliv_id", length = 21, nullable = false)
    private String dlivId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "dliv_status_cd_before", length = 20)
    private String dlivStatusCdBefore;

    @Column(name = "dliv_status_cd", length = 20)
    private String dlivStatusCd;

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