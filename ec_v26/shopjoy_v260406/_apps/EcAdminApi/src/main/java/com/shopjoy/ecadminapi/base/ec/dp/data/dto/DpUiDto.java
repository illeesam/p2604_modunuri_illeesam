package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpUiDto {

    // ── dp_ui ──────────────────────────────────────────
    private String uiId;
    private String siteId;
    private String uiCd;
    private String uiNm;
    private String uiDesc;
    private String deviceTypeCd;
    private String uiPath;
    private Integer sortOrd;
    private String useYn;
    private LocalDate useStartDate;
    private LocalDate useEndDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
