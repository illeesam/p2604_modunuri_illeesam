package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyNotice;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyNoticeReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public SyNotice toEntity() {
        return SyNotice.builder()
                .noticeId(noticeId)
                .siteId(siteId)
                .noticeTitle(noticeTitle)
                .noticeTypeCd(noticeTypeCd)
                .isFixed(isFixed)
                .contentHtml(contentHtml)
                .attachGrpId(attachGrpId)
                .startDate(startDate)
                .endDate(endDate)
                .noticeStatusCd(noticeStatusCd)
                .viewCount(viewCount)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
