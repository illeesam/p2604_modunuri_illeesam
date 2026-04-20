package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pdh_prod_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 변경 이력 엔티티
public class PdhProdChgHist {

    @Id
    @Column(name = "prod_chg_hist_id", length = 21, nullable = false)
    private String prodChgHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "chg_type_cd", length = 30)
    private String chgTypeCd;

    @Lob
    @Column(name = "before_val", columnDefinition = "TEXT")
    private String beforeVal;

    @Lob
    @Column(name = "after_val", columnDefinition = "TEXT")
    private String afterVal;

    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Column(name = "chg_user_id", length = 21)
    private String chgUserId;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}