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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "syh_batch_hist", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배치 실행 이력 엔티티
@Comment("배치 실행 이력")
public class SyhBatchHist extends BaseEntity {

    @Id
    @Comment("이력ID")
    @Column(name = "batch_hist_id", length = 21, nullable = false)
    @Size(max = 21, message = "batchHistId 는 21자 이내여야 합니다.")
    private String batchHistId;


    @Comment("배치ID")
    @Column(name = "batch_id", length = 21, nullable = false)
    @Size(max = 21, message = "batchId 는 21자 이내여야 합니다.")
    private String batchId;

    @Comment("배치코드")
    @Column(name = "batch_code", length = 50)
    @Size(max = 50, message = "batchCode 는 50자 이내여야 합니다.")
    private String batchCode;

    @Comment("배치명")
    @Column(name = "batch_nm", length = 100)
    @Size(max = 100, message = "batchNm 는 100자 이내여야 합니다.")
    private String batchNm;

    @Comment("실행시작일시")
    @Column(name = "run_at")
    private LocalDateTime runAt;

    @Comment("실행종료일시")
    @Column(name = "end_at")
    private LocalDateTime endAt;

    @Comment("실행시간(ms)")
    @Column(name = "duration_ms")
    private Integer durationMs;

    @Comment("실행결과 (SUCCESS/FAILED/TIMEOUT)")
    @Column(name = "run_status_cd", length = 20)
    @Size(max = 20, message = "runStatusCd 는 20자 이내여야 합니다.")
    private String runStatusCd;

    @Comment("처리건수")
    @Column(name = "proc_count")
    private Integer procCount;

    @Comment("오류건수")
    @Column(name = "error_count")
    private Integer errorCount;

    @Comment("결과메시지")
    @Column(name = "message", columnDefinition = "TEXT")
    @Size(max = 50000, message = "message 는 50000자 이내여야 합니다.")
    private String message;

    @Comment("상세로그 (JSON)")
    @Column(name = "detail", columnDefinition = "TEXT")
    @Size(max = 50000, message = "detail 는 50000자 이내여야 합니다.")
    private String detail;

}
