package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_set_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 세트상품 구성 엔티티
public class PdProdSetItem extends BaseEntity {

    @Id
    @Column(name = "set_item_id", length = 21, nullable = false)
    private String setItemId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "set_prod_id", length = 21, nullable = false)
    private String setProdId;

    @Column(name = "item_prod_id", length = 21)
    private String itemProdId;

    @Column(name = "item_sku_id", length = 21)
    private String itemSkuId;

    @Column(name = "item_nm", length = 200, nullable = false)
    private String itemNm;

    @Column(name = "item_qty")
    private Integer itemQty;

    @Column(name = "item_desc", length = 300)
    private String itemDesc;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
