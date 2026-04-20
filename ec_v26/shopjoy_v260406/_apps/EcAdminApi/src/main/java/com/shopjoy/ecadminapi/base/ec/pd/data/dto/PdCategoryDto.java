package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 상품 카테고리 DTO
public class PdCategoryDto {

    // ── pd_category ──────────────────────────────────────────────
    private String categoryId;
    private String siteId;
    private String parentCategoryId;
    private String categoryNm;
    private Integer categoryDepth;
    private Integer sortOrd;
    private String categoryStatusCd;
    private String categoryStatusCdBefore;
    private String imgUrl;
    private String categoryDesc;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: self (parent) ──────────────────────────────────────
    private String parentCategoryNm;
    private String grandParentCategoryNm;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String categoryStatusCdNm;
}
