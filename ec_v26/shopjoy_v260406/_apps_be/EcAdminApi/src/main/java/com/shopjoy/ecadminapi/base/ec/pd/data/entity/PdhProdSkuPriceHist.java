package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pdh_prod_sku_price_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 SKU 가격 이력 엔티티
@Comment("SKU 가격 변경 이력")
public class PdhProdSkuPriceHist {

    @Id
    @Comment("이력ID (YYMMDDhhmmss+rand4)")
    @Column(name = "hist_id", length = 21, nullable = false)
    private String histId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("SKU ID (pd_prod_sku.sku_id)")
    @Column(name = "sku_id", length = 21, nullable = false)
    private String skuId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("변경 전 옵션 추가금액")
    @Column(name = "add_price_before", nullable = false)
    private Long addPriceBefore;

    @Comment("변경 후 옵션 추가금액")
    @Column(name = "add_price_after", nullable = false)
    private Long addPriceAfter;

    @Comment("변경사유")
    @Column(name = "chg_reason", length = 200)
    private String chgReason;

    @Comment("처리자 (sy_user.user_id)")
    @Column(name = "chg_by", length = 20)
    private String chgBy;

    @Comment("처리일시")
    @Column(name = "chg_date")
    private LocalDateTime chgDate;

    @Comment("등록자")
    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Comment("등록일")
    @Column(name = "reg_date")
    private LocalDateTime regDate;

}