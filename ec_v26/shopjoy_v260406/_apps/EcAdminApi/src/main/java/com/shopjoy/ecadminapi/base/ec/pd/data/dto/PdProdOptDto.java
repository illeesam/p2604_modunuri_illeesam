package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 상품 옵션 DTO
public class PdProdOptDto {

    // ── pd_prod_opt ──────────────────────────────────────────────
    private String  optId;
    private String  siteId;
    private String  prodId;
    private String  optGrpNm;
    private Integer optLevel;
    private String  optTypeCd;
    private String  optInputTypeCd;
    private Integer sortOrd;
    private String  regBy;
    private LocalDateTime regDate;
    private String  updBy;
    private LocalDateTime updDate;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String siteNm;
    private String optTypeCdNm;
    private String optInputTypeCdNm;
}
