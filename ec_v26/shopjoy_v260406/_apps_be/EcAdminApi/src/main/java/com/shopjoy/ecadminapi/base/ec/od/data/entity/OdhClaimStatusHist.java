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
@Table(name = "odh_claim_status_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 상태 이력 엔티티
public class OdhClaimStatusHist extends BaseEntity {

    @Id
    @Column(name = "claim_status_hist_id", length = 21, nullable = false)
    private String claimStatusHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Column(name = "order_id", length = 21)
    private String orderId;

    @Column(name = "claim_status_cd_before", length = 20)
    private String claimStatusCdBefore;

    @Column(name = "claim_status_cd", length = 20)
    private String claimStatusCd;

    @Column(name = "status_reason", length = 300)
    private String statusReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "memo", length = 300)
    private String memo;

}
