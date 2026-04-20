package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_batch", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배치 엔티티
public class SyBatch {

    @Id
    @Column(name = "batch_id", length = 21, nullable = false)
    private String batchId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "batch_code", length = 50, nullable = false)
    private String batchCode;

    @Column(name = "batch_nm", length = 100, nullable = false)
    private String batchNm;

    @Lob
    @Column(name = "batch_desc", columnDefinition = "TEXT")
    private String batchDesc;

    @Column(name = "cron_expr", length = 100)
    private String cronExpr;

    @Column(name = "batch_cycle_cd", length = 20)
    private String batchCycleCd;

    @Column(name = "batch_last_run")
    private LocalDateTime batchLastRun;

    @Column(name = "batch_next_run")
    private LocalDateTime batchNextRun;

    @Column(name = "batch_run_count")
    private Integer batchRunCount;

    @Column(name = "batch_status_cd", length = 20)
    private String batchStatusCd;

    @Column(name = "batch_run_status", length = 20)
    private String batchRunStatus;

    @Column(name = "batch_timeout_sec")
    private Integer batchTimeoutSec;

    @Lob
    @Column(name = "batch_memo", columnDefinition = "TEXT")
    private String batchMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

}