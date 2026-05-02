package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "odh_pay_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제 변경 이력 엔티티
public class OdhPayChgHist extends BaseEntity {

    @Id
    @Column(name = "pay_chg_hist_id", length = 21, nullable = false)
    private String payChgHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "pay_id", length = 21, nullable = false)
    private String payId;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "pay_status_cd_before", length = 20)
    private String payStatusCdBefore;

    @Column(name = "pay_status_cd_after", length = 20)
    private String payStatusCdAfter;

    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Column(name = "chg_reason", length = 300)
    private String chgReason;

    @Column(name = "pg_response", columnDefinition = "TEXT")
    private String pgResponse;

    @Column(name = "refund_amt")
    private Long refundAmt;

    @Column(name = "refund_pg_tid", length = 100)
    private String refundPgTid;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "memo", length = 300)
    private String memo;

}
