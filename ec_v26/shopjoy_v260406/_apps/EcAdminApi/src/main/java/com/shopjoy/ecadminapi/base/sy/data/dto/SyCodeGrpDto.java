package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyCodeGrpDto {

    // ── sy_code_grp ──────────────────────────────────────────
    private String codeGrpId;
    private String siteId;
    private String codeGrp;
    private String grpNm;
    private String dispPath;
    private String codeGrpDesc;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
