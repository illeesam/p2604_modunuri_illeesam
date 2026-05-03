package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAttachDto {

    // ── sy_attach ──────────────────────────────────────────
    private String attachId;
    private String siteId;
    private String attachGrpId;
    private String fileNm;
    private Long fileSize;
    private String fileExt;
    private String mimeTypeCd;
    private String storedNm;
    private String attachUrl;
    private String storagePath;
    private String physicalPath;
    private String cdnHost;
    private String cdnImgUrl;
    private String cdnThumbUrl;
    private String thumbFileNm;
    private String thumbStoredNm;
    private String thumbUrl;
    private String thumbCdnUrl;
    private String thumbGeneratedYn;
    private Integer sortOrd;
    private String attachMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
