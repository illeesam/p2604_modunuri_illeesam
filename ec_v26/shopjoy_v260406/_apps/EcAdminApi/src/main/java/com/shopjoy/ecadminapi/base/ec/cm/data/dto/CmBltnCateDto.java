package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnCateDto {

    // ── cm_bltn_cate ─────────────────────────────────────────────
    private String blogCateId;
    private String siteId;
    private String blogCateNm;
    private String parentBlogCateId;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: sy_site ─────────────────────────────────────────────
    private String siteNm;
}
