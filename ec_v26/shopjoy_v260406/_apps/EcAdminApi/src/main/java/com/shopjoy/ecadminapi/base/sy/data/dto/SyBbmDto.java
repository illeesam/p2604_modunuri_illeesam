package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBbmDto {

    // ── sy_bbm ──────────────────────────────────────────
    private String bbmId;
    private String siteId;
    private String bbmCode;
    private String bbmNm;
    private String dispPath;
    private String bbmTypeCd;
    private String allowComment;
    private String allowAttach;
    private String allowLike;
    private String contentTypeCd;
    private String scopeTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String bbmRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
