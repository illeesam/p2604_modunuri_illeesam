package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_batch", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배치 엔티티
public class SyBatch extends BaseEntity {

    @Id
    @Column(name = "batch_id", length = 21, nullable = false)
    private String batchId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "batch_code", length = 50, nullable = false)
    private String batchCode;

    @Column(name = "batch_nm", length = 100, nullable = false)
    private String batchNm;

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

    @Column(name = "batch_memo", columnDefinition = "TEXT")
    private String batchMemo;

    @Column(name = "path_id", length = 21)
    private String pathId;

}
