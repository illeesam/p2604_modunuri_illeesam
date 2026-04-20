package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pdh_prod_sku_price_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 SKU 가격 이력 엔티티
public class PdhProdSkuPriceHist {

    @Id
    @Column(name = "hist_id", length = 21, nullable = false)
    private String histId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "add_price_before", nullable = false)
    private Long addPriceBefore;

    @Column(name = "add_price_after", nullable = false)
    private Long addPriceAfter;

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