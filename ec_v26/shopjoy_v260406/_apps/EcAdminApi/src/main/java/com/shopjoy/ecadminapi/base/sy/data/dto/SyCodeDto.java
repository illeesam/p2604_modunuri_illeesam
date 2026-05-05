package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyCodeDto {

    // ── sy_code ──────────────────────────────────────────
    private String codeId;
    private String siteId;
    private String codeGrp;
    private String codeValue;
    private String codeLabel;
    private Integer sortOrd;
    private String useYn;
    private String parentCodeValue;
    private String childCodeValues;
    private String codeRemark;
    private Integer codeLevel;
    private String codeOpt1;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
