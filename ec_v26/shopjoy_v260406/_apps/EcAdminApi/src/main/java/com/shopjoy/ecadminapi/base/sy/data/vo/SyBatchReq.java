package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBatch;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBatchReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String batchId;
    private String siteId;
    private String batchCode;
    private String batchNm;
    private String batchDesc;
    private String cronExpr;
    private String batchCycleCd;
    private LocalDateTime batchLastRun;
    private LocalDateTime batchNextRun;
    private Integer batchRunCount;
    private String batchStatusCd;
    private String batchRunStatus;
    private Integer batchTimeoutSec;
    private String batchMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SyBatch toEntity() {
        return SyBatch.builder()
                .batchId(batchId)
                .siteId(siteId)
                .batchCode(batchCode)
                .batchNm(batchNm)
                .batchDesc(batchDesc)
                .cronExpr(cronExpr)
                .batchCycleCd(batchCycleCd)
                .batchLastRun(batchLastRun)
                .batchNextRun(batchNextRun)
                .batchRunCount(batchRunCount)
                .batchStatusCd(batchStatusCd)
                .batchRunStatus(batchRunStatus)
                .batchTimeoutSec(batchTimeoutSec)
                .batchMemo(batchMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}
