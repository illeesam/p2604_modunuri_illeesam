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
@Table(name = "pd_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 엔티티
public class PdProd {

    @Id
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "category_id", length = 21)
    private String categoryId;

    @Column(name = "brand_id", length = 21)
    private String brandId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "md_user_id", length = 21)
    private String mdUserId;

    @Column(name = "prod_nm", length = 200, nullable = false)
    private String prodNm;

    @Column(name = "prod_type_cd", length = 20)
    private String prodTypeCd;

    @Column(name = "prod_code", length = 50)
    private String prodCode;

    @Column(name = "list_price")
    private Long listPrice;

    @Column(name = "sale_price")
    private Long salePrice;

    @Column(name = "purchase_price")
    private Long purchasePrice;

    @Column(name = "margin_rate")
    private BigDecimal marginRate;

    @Column(name = "prod_stock")
    private Integer prodStock;

    @Column(name = "prod_status_cd", length = 20)
    private String prodStatusCd;

    @Column(name = "prod_status_cd_before", length = 20)
    private String prodStatusCdBefore;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Lob
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "weight")
    private BigDecimal weight;

    @Column(name = "size_info_cd", length = 100)
    private String sizeInfoCd;

    @Column(name = "is_new", length = 1)
    private String isNew;

    @Column(name = "is_best", length = 1)
    private String isBest;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "sale_count")
    private Integer saleCount;

    @Column(name = "sale_start_date")
    private LocalDateTime saleStartDate;

    @Column(name = "sale_end_date")
    private LocalDateTime saleEndDate;

    @Column(name = "min_buy_qty")
    private Integer minBuyQty;

    @Column(name = "max_buy_qty")
    private Integer maxBuyQty;

    @Column(name = "day_max_buy_qty")
    private Integer dayMaxBuyQty;

    @Column(name = "id_max_buy_qty")
    private Integer idMaxBuyQty;

    @Column(name = "adlt_yn", length = 1)
    private String adltYn;

    @Column(name = "same_day_dliv_yn", length = 1)
    private String sameDayDlivYn;

    @Column(name = "sold_out_yn", length = 1)
    private String soldOutYn;

    @Column(name = "dliv_tmplt_id", length = 21)
    private String dlivTmpltId;

    @Column(name = "coupon_use_yn", length = 1)
    private String couponUseYn;

    @Column(name = "save_use_yn", length = 1)
    private String saveUseYn;

    @Column(name = "discnt_use_yn", length = 1)
    private String discntUseYn;

    @Column(name = "advrt_stmt", length = 500)
    private String advrtStmt;

    @Column(name = "advrt_start_date")
    private LocalDateTime advrtStartDate;

    @Column(name = "advrt_end_date")
    private LocalDateTime advrtEndDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}