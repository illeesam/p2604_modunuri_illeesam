package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pdh_prod_sku_chg_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 SKU 변경 이력 엔티티
public class PdhProdSkuChgHist {

    @Id
    @Column(name = "hist_id", length = 21, nullable = false)
    private String histId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "chg_type_cd", length = 30, nullable = false)
    private String chgTypeCd;

    @Column(name = "before_val", length = 100)
    private String beforeVal;

    @Column(name = "after_val", length = 100)
    private String afterVal;

    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Column(name = "chg_by", length = 20)
    private String chgBy;

    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

}