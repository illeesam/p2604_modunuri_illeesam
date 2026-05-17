package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_batch", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배치 엔티티
@Comment("배치 작업")
public class SyBatch extends BaseEntity {

    @Id
    @Comment("배치ID (YYMMDDhhmmss+rand4)")
    @Column(name = "batch_id", length = 21, nullable = false)
    private String batchId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("배치코드")
    @Column(name = "batch_code", length = 50, nullable = false)
    private String batchCode;

    @Comment("배치명")
    @Column(name = "batch_nm", length = 100, nullable = false)
    private String batchNm;

    @Comment("배치설명")
    @Column(name = "batch_desc", columnDefinition = "TEXT")
    private String batchDesc;

    @Comment("Cron 표현식")
    @Column(name = "cron_expr", length = 100)
    private String cronExpr;

    @Comment("주기유형 (코드: BATCH_CYCLE)")
    @Column(name = "batch_cycle_cd", length = 20)
    private String batchCycleCd;

    @Comment("최근실행일시")
    @Column(name = "batch_last_run")
    private LocalDateTime batchLastRun;

    @Comment("다음실행예정일시")
    @Column(name = "batch_next_run")
    private LocalDateTime batchNextRun;

    @Comment("실행횟수")
    @Column(name = "batch_run_count")
    private Integer batchRunCount;

    @Comment("활성상태 (코드: BATCH_STATUS)")
    @Column(name = "batch_status_cd", length = 20)
    private String batchStatusCd;

    @Comment("실행상태 (IDLE/RUNNING/SUCCESS/FAILED)")
    @Column(name = "batch_run_status", length = 20)
    private String batchRunStatus;

    @Comment("타임아웃(초)")
    @Column(name = "batch_timeout_sec")
    private Integer batchTimeoutSec;

    @Comment("메모")
    @Column(name = "batch_memo", columnDefinition = "TEXT")
    private String batchMemo;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
