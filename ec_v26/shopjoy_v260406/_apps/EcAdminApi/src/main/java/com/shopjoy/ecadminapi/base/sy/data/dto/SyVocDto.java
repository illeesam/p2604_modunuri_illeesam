package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVocDto {

    // ── sy_voc ──────────────────────────────────────────
    private String vocId;
    private String siteId;
    private String vocMasterCd;
    private String vocDetailCd;
    private String vocNm;
    private String vocContent;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
