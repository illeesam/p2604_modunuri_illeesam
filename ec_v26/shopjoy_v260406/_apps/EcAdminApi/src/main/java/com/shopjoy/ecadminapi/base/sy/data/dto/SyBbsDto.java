package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBbsDto {

    // ── sy_bbs ──────────────────────────────────────────
    private String bbsId;
    private String siteId;
    private String bbmId;
    private String parentBbsId;
    private String memberId;
    private String authorNm;
    private String bbsTitle;
    private String contentHtml;
    private String attachGrpId;
    private Integer viewCount;
    private Integer likeCount;
    private Integer commentCount;
    private String isFixed;
    private String bbsStatusCd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
