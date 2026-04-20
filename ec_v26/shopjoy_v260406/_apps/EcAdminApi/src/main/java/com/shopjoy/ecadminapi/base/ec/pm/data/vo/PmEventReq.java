package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEvent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PmEvent toEntity() {
        return PmEvent.builder()
                .eventId(eventId)
                .siteId(siteId)
                .eventNm(eventNm)
                .eventTypeCd(eventTypeCd)
                .imgUrl(imgUrl)
                .eventTitle(eventTitle)
                .eventContent(eventContent)
                .startDate(startDate)
                .endDate(endDate)
                .noticeStart(noticeStart)
                .noticeEnd(noticeEnd)
                .eventStatusCd(eventStatusCd)
                .eventStatusCdBefore(eventStatusCdBefore)
                .targetTypeCd(targetTypeCd)
                .sortOrd(sortOrd)
                .viewCnt(viewCnt)
                .useYn(useYn)
                .eventDesc(eventDesc)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
