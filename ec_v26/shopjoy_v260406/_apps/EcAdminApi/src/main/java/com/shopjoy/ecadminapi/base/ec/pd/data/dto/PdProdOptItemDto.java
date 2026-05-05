package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdOptItemDto {

    // ── pd_prod_opt_item ──────────────────────────────────────────
    private String optItemId;
    private String siteId;
    private String optId;
    private String optTypeCd;
    private String optNm;
    private String optVal;
    private String optValCodeId;
    private String parentOptItemId;
    private String optStyle;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
