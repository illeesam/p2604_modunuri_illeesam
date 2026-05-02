package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_bundle_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 묶음상품 구성 엔티티
public class PdProdBundleItem extends BaseEntity {

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

}
