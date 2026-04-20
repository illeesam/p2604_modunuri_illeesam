package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAttachGrpDto {

    // ── sy_attach_grp ──────────────────────────────────────────
    private String attachGrpId;
    private String attachGrpCode;
    private String attachGrpNm;
    private String fileExtAllow;
    private Long maxFileSize;
    private Integer maxFileCount;
    private String storagePath;
    private String useYn;
    private Integer sortOrd;
    private String attachGrpRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
