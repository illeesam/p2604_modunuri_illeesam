package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_prod_sku", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 SKU 엔티티
@Comment("상품 옵션 SKU (조합별 재고/가격)")
public class PdProdSku extends BaseEntity {

    @Id
    @Comment("SKU ID")
    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("옵션1 값ID (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Comment("옵션2 값ID (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Comment("자체 SKU 코드")
    @Column(name = "sku_code", length = 50)
    private String skuCode;

    @Comment("옵션 추가금액 (기본가 대비)")
    @Column(name = "add_price")
    private Long addPrice;

    @Comment("해당 옵션 조합 재고수량")
    @Column(name = "prod_opt_stock")
    private Integer prodOptStock;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
