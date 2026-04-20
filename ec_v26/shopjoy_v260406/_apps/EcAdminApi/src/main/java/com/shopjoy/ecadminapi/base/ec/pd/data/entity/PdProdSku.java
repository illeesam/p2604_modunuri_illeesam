package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_sku", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 SKU 엔티티
public class PdProdSku {

    @Id
    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "opt_item_id_1", length = 20)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 20)
    private String optItemId2;

    @Column(name = "sku_code", length = 50)
    private String skuCode;

    @Column(name = "add_price")
    private Long addPrice;

    @Column(name = "prod_opt_stock")
    private Integer prodOptStock;

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