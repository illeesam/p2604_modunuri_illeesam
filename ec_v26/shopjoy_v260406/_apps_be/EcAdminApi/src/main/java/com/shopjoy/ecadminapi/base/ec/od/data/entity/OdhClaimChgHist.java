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
@Table(name = "odh_claim_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 변경 이력 엔티티
public class OdhClaimChgHist extends BaseEntity {

    @Id
    @Column(name = "claim_chg_hist_id", length = 21, nullable = false)
    private String claimChgHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Column(name = "chg_field", length = 50)
    private String chgField;

    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Column(name = "chg_reason", length = 300)
    private String chgReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

}
