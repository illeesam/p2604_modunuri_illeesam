package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
// 상품 옵션 DTO
public class PdProdOptDto {

    // ── pd_prod_opt ──────────────────────────────────────────────
    private String optId;
    private String prodId;
    private String optNm;
    private Integer optLevel;
    private String optTypeCd;
    private Integer sortNo;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: sy_code → 코드명 ─────────────────────────────────────
    private String optTypeCdNm;
}
