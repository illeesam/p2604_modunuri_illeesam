package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdCategoryProdDto {

    // ── pd_category_prod ──────────────────────────────────────────
    private String categoryProdId;
    private String siteId;
    private String categoryId;
    private String prodId;
    private String categoryProdTypeCd;
    private Integer sortOrd;
    private String emphasisCd;
    private String dispYn;
    private LocalDate dispStartDate;
    private LocalDate dispEndDate;
    private String regBy;
    private LocalDateTime regDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
