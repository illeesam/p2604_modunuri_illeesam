package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_bundle_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 묶음상품 구성 엔티티
public class PdProdBundleItem {

    @Id
    @Column(name = "bundle_item_id", length = 21, nullable = false)
    private String bundleItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "bundle_prod_id", length = 21, nullable = false)
    private String bundleProdId;

    @Column(name = "item_prod_id", length = 21, nullable = false)
    private String itemProdId;

    @Column(name = "item_sku_id", length = 21)
    private String itemSkuId;

    @Column(name = "item_qty")
    private Integer itemQty;

    @Column(name = "price_rate", nullable = false)
    private BigDecimal priceRate;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}