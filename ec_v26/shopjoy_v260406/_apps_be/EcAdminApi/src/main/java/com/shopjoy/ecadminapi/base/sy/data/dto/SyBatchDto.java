package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBatchDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String batchId;  // 배치ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 20) private String status;  // 활성상태 필터 — BATCH_STATUS {PENDING:대기, RUNNING:실행중, DONE:완료, FAILED:실패, ACTIVE:사용, INACTIVE:미사용}
        @Size(max = 20) private String batchRunStatusCd;  // 실행상태 필터 — BATCH_RUN_STATUS {SUCCESS:성공, FAILED:실패, RUNNING:실행중, IDLE:대기}
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_batch ──────────────────────────────────────────
        private String batchId;  // 배치ID (YYMMDDhhmmss+rand4)
        private String batchCode;  // 배치코드
        private String batchNm;  // 배치명
        private String batchDesc;  // 배치설명
        private String cronExpr;  // Cron 표현식
        private String batchCycleCd;  // 주기유형 — BATCH_CYCLE_CD {MANUAL:수동, HOURLY:시간별, DAILY:일간, WEEKLY:주간, MONTHLY:월간}
        private LocalDateTime batchLastRun;  // 최근실행일시
        private LocalDateTime batchNextRun;  // 다음실행예정일시
        private Integer batchRunCount;  // 실행횟수
        private String batchStatusCd;  // 활성상태 — BATCH_STATUS {PENDING:대기, RUNNING:실행중, DONE:완료, FAILED:실패, ACTIVE:사용, INACTIVE:미사용}
        private String batchRunStatusCd;  // 실행상태 — BATCH_RUN_STATUS {SUCCESS:성공, FAILED:실패, RUNNING:실행중, IDLE:대기}
        private Integer batchTimeoutSec;  // 타임아웃(초)
        private String batchMemo;  // 메모
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────
    }

    /** 응답 */
}
