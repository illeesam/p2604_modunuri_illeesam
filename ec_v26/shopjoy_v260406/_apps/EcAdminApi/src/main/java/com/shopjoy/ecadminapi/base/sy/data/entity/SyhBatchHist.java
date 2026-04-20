package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "syh_batch_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 배치 실행 이력 엔티티
public class SyhBatchHist {

    @Id
    @Column(name = "batch_hist_id", length = 21, nullable = false)
    private String batchHistId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "batch_id", length = 21, nullable = false)
    private String batchId;

    @Column(name = "batch_code", length = 50)
    private String batchCode;

    @Column(name = "batch_nm", length = 100)
    private String batchNm;

    @Column(name = "run_at")
    private LocalDateTime runAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "run_status", length = 20)
    private String runStatus;

    @Column(name = "proc_count")
    private Integer procCount;

    @Column(name = "error_count")
    private Integer errorCount;

    @Lob
    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Lob
    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}