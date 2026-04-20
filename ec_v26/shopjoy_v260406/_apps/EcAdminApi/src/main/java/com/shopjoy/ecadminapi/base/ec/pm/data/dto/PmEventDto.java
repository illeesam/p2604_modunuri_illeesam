package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventDto {

    // ── pm_event ──────────────────────────────────────────
    private String eventId;
    private String siteId;
    private String eventNm;
    private String eventTypeCd;
    private String imgUrl;
    private String eventTitle;
    private String eventContent;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate noticeStart;
    private LocalDate noticeEnd;
    private String eventStatusCd;
    private String eventStatusCdBefore;
    private String targetTypeCd;
    private Integer sortOrd;
    private Integer viewCnt;
    private String useYn;
    private String eventDesc;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
