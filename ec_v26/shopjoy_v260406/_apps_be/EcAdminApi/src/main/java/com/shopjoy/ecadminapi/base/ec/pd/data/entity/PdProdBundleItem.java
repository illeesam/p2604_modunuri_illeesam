package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_prod_bundle_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 묶음상품 구성 엔티티
@Comment("묶음상품 구성품 (prod_type_cd=BUNDLE)")
public class PdProdBundleItem extends BaseEntity {

    @Id
    @Comment("묶음구성ID (YYMMDDhhmmss+rand4)")
    @Column(name = "bundle_item_id", length = 21, nullable = false)
    private String bundleItemId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)")
    @Column(name = "bundle_prod_id", length = 21, nullable = false)
    private String bundleProdId;

    @Comment("구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품")
    @Column(name = "item_prod_id", length = 21, nullable = false)
    private String itemProdId;

    @Comment("구성품 SKU ID (pd_prod_sku.sku_id, NULL=SKU 미지정)")
    @Column(name = "item_sku_id", length = 21)
    private String itemSkuId;

    @Comment("구성 수량 (기본 1)")
    @Column(name = "item_qty")
    private Integer itemQty;

    @Comment("가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준")
    @Column(name = "price_rate", nullable = false)
    private BigDecimal priceRate;

    @Comment("노출 정렬 순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
