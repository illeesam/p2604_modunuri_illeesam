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
@Table(name = "syh_batch_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배치 실행 이력 엔티티
public class SyhBatchHist extends BaseEntity {

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

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

}
