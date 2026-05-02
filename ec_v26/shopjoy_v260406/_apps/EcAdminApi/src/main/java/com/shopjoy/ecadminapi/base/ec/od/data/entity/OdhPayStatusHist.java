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
@Table(name = "odh_pay_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 결제 상태 이력 엔티티
public class OdhPayStatusHist extends BaseEntity {

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

}
