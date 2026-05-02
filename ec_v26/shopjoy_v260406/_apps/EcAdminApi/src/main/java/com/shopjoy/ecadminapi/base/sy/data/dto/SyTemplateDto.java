package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyTemplateDto {

    // ── sy_template ──────────────────────────────────────────
    private String templateId;
    private String siteId;
    private String templateTypeCd;
    private String templateCode;
    private String templateNm;
    private String templateSubject;
    private String templateContent;
    private String sampleParams;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String pathId;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
