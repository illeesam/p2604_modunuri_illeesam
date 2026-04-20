package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
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
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
