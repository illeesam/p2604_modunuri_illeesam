package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class DpAreaDto {

    // ── dp_area ──────────────────────────────────────────
    private String areaId;
    private String uiId;
    private String siteId;
    private String areaCd;
    private String areaNm;
    private String areaTypeCd;
    private String areaDesc;
    private String dispPath;
    private String useYn;
    private LocalDate useStartDate;
    private LocalDate useEndDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
