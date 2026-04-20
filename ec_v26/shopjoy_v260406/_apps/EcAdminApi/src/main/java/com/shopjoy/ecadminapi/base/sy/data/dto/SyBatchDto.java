package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBatchDto {

    // ── sy_batch ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
