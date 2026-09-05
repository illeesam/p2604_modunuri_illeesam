package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_prod_set_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 세트상품 구성 엔티티
@Comment("세트상품 구성 목록 (prod_type_cd=SET, 표시·배송 단위 정의)")
public class PdProdSetItem extends BaseEntity {

    @Id
    @Comment("세트구성ID (YYMMDDhhmmss+rand4)")
    @Column(name = "prod_set_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodSetItemId 는 21자 이내여야 합니다.")
    private String prodSetItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("세트상품ID (pd_prod.prod_id, prod_type_cd=SET)")
    @Column(name = "set_prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "setProdId 는 21자 이내여야 합니다.")
    private String setProdId;

    @Comment("구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)")
    @Column(name = "item_prod_id", length = 21)
    @Size(max = 21, message = "itemProdId 는 21자 이내여야 합니다.")
    private String itemProdId;

    @Comment("구성품 SKU ID (pd_prod_sku.prod_sku_id, NULL=SKU 미지정)")
    @Column(name = "item_sku_id", length = 21)
    @Size(max = 21, message = "itemSkuId 는 21자 이내여야 합니다.")
    private String itemSkuId;

    @Comment("구성품 표시명 (예: 머그컵, 접시 2p)")
    @Column(name = "item_nm", length = 200, nullable = false)
    @Size(max = 200, message = "itemNm 는 200자 이내여야 합니다.")
    private String itemNm;

    @Comment("구성 수량")
    @Column(name = "item_qty")
    private Integer itemQty;

    @Comment("구성품 부가 설명 (소재·용량·색상 등)")
    @Column(name = "item_desc", length = 300)
    @Size(max = 300, message = "itemDesc 는 300자 이내여야 합니다.")
    private String itemDesc;

    @Comment("노출 정렬 순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
