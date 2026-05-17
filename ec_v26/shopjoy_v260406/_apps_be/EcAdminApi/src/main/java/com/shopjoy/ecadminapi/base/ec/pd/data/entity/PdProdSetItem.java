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
@Table(name = "pd_prod_set_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 세트상품 구성 엔티티
@Comment("세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)")
public class PdProdSetItem extends BaseEntity {

    @Id
    @Comment("세트구성ID (YYMMDDhhmmss+rand4)")
    @Column(name = "set_item_id", length = 21, nullable = false)
    private String setItemId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("세트상품ID (pd_prod.prod_id, prod_type_cd=SET)")
    @Column(name = "set_prod_id", length = 21, nullable = false)
    private String setProdId;

    @Comment("구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)")
    @Column(name = "item_prod_id", length = 21)
    private String itemProdId;

    @Comment("구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)")
    @Column(name = "item_sku_id", length = 21)
    private String itemSkuId;

    @Comment("구성품 표시명 (예: 머그컵, 접시 2p)")
    @Column(name = "item_nm", length = 200, nullable = false)
    private String itemNm;

    @Comment("구성 수량")
    @Column(name = "item_qty")
    private Integer itemQty;

    @Comment("구성품 부가 설명 (소재·용량·색상 등)")
    @Column(name = "item_desc", length = 300)
    private String itemDesc;

    @Comment("노출 정렬 순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
