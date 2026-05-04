package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_sku", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 SKU 엔티티
public class PdProdSku extends BaseEntity {

    @Id
    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Column(name = "sku_code", length = 50)
    private String skuCode;

    @Column(name = "add_price")
    private Long addPrice;

    @Column(name = "prod_opt_stock")
    private Integer prodOptStock;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
