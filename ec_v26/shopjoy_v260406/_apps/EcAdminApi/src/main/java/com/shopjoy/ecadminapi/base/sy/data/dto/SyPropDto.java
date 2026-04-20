package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyPropDto {

    // ── sy_prop ──────────────────────────────────────────
    private String siteId;
    private String dispPath;
    private String propKey;
    private String propValue;
    private String propLabel;
    private String propTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String propRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
