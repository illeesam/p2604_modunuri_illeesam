package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveIssue;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmSaveIssueReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String saveIssueId;
    private String siteId;
    private String memberId;
    private String saveIssueTypeCd;
    private Long saveAmt;
    private BigDecimal saveRate;
    private String refTypeCd;
    private String refId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private LocalDateTime expireDate;
    private String issueStatusCd;
    private String issueStatusCdBefore;
    private String saveMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmSaveIssue toEntity() {
        return PmSaveIssue.builder()
                .saveIssueId(saveIssueId)
                .siteId(siteId)
                .memberId(memberId)
                .saveIssueTypeCd(saveIssueTypeCd)
                .saveAmt(saveAmt)
                .saveRate(saveRate)
                .refTypeCd(refTypeCd)
                .refId(refId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .expireDate(expireDate)
                .issueStatusCd(issueStatusCd)
                .issueStatusCdBefore(issueStatusCdBefore)
                .saveMemo(saveMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
