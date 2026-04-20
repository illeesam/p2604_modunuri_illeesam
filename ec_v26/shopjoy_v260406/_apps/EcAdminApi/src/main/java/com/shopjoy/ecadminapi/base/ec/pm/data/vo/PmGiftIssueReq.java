package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftIssue;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmGiftIssueReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String giftIssueId;
    private String giftId;
    private String siteId;
    private String memberId;
    private String orderId;
    private LocalDateTime issueDate;
    private String giftIssueStatusCd;
    private String giftIssueStatusCdBefore;
    private String giftIssueMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmGiftIssue toEntity() {
        return PmGiftIssue.builder()
                .giftIssueId(giftIssueId)
                .giftId(giftId)
                .siteId(siteId)
                .memberId(memberId)
                .orderId(orderId)
                .issueDate(issueDate)
                .giftIssueStatusCd(giftIssueStatusCd)
                .giftIssueStatusCdBefore(giftIssueStatusCdBefore)
                .giftIssueMemo(giftIssueMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
