package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyhBatchHistDto {

    // ── syh_batch_hist ──────────────────────────────────────────
    private String batchHistId;
    private String siteId;
    private String batchId;
    private String batchCode;
    private String batchNm;
    private LocalDateTime runAt;
    private LocalDateTime endAt;
    private Integer durationMs;
    private String runStatus;
    private Integer procCount;
    private Integer errorCount;
    private String message;
    private String detail;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
