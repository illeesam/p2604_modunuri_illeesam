package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponIssue;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCouponIssueReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String issueId;
    private String siteId;
    private String couponId;
    private String memberId;
    private LocalDateTime issueDate;
    private String useYn;
    private LocalDateTime useDate;
    private String orderId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmCouponIssue toEntity() {
        return PmCouponIssue.builder()
                .issueId(issueId)
                .siteId(siteId)
                .couponId(couponId)
                .memberId(memberId)
                .issueDate(issueDate)
                .useYn(useYn)
                .useDate(useDate)
                .orderId(orderId)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
