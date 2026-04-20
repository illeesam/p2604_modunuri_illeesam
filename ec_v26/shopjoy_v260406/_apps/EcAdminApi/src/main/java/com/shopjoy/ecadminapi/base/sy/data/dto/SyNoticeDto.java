package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyNoticeDto {

    // ── sy_notice ──────────────────────────────────────────
    private String noticeId;
    private String siteId;
    private String noticeTitle;
    private String noticeTypeCd;
    private String isFixed;
    private String contentHtml;
    private String attachGrpId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String noticeStatusCd;
    private Integer viewCount;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
