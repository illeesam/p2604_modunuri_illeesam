package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 상품 DTO
public class PdProdDto {

    // ── pd_prod ──────────────────────────────────────────────────
    private String prodId;
    private String siteId;
    private String categoryId;
    private String brandId;
    private String vendorId;
    private String mdUserId;
    private String prodNm;
    private String prodTypeCd;
    private String prodCode;
    private Long   listPrice;
    private Long   salePrice;
    private Long   purchasePrice;
    private BigDecimal marginRate;
    private Integer prodStock;
    private String prodStatusCd;
    private String prodStatusCdBefore;
    private String thumbnailUrl;
    private String contentHtml;
    private BigDecimal weight;
    private String sizeInfoCd;
    private String isNew;
    private String isBest;
    private Integer viewCount;
    private Integer saleCount;
    private LocalDateTime saleStartDate;
    private LocalDateTime saleEndDate;
    private Integer minBuyQty;
    private Integer maxBuyQty;
    private Integer dayMaxBuyQty;
    private Integer idMaxBuyQty;
    private String adltYn;
    private String sameDayDlivYn;
    private String soldOutYn;
    private String dlivTmpltId;
    private String couponUseYn;
    private String saveUseYn;
    private String discntUseYn;
    private String advrtStmt;
    private LocalDateTime advrtStartDate;
    private LocalDateTime advrtEndDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: pd_category ────────────────────────────────────────
    private String cateNm;
    private String parentCategoryId;

    // ── JOIN: sy_brand ───────────────────────────────────────────
    private String brandNm;

    // ── JOIN: sy_vendor ──────────────────────────────────────────
    private String vendorNm;
    private String vendorTel;

    // ── JOIN: sy_user (담당MD) ────────────────────────────────────
    private String mdUserNm;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String prodStatusCdNm;
    private String prodTypeCdNm;
    private String sizeInfoCdNm;
}
