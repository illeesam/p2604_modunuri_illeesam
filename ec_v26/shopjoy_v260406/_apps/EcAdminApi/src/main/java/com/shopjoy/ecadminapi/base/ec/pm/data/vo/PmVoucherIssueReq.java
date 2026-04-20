package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucherIssue;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmVoucherIssueReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String voucherIssueId;
    private String voucherId;
    private String siteId;
    private String memberId;
    private String voucherCode;
    private LocalDateTime issueDate;
    private LocalDateTime expireDate;
    private LocalDateTime useDate;
    private String orderId;
    private Long useAmt;
    private String voucherIssueStatusCd;
    private String voucherIssueStatusCdBefore;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmVoucherIssue toEntity() {
        return PmVoucherIssue.builder()
                .voucherIssueId(voucherIssueId)
                .voucherId(voucherId)
                .siteId(siteId)
                .memberId(memberId)
                .voucherCode(voucherCode)
                .issueDate(issueDate)
                .expireDate(expireDate)
                .useDate(useDate)
                .orderId(orderId)
                .useAmt(useAmt)
                .voucherIssueStatusCd(voucherIssueStatusCd)
                .voucherIssueStatusCdBefore(voucherIssueStatusCdBefore)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
