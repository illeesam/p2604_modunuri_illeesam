package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
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
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String batchId;
        @Size(max = 21) private String pathId;
        @Size(max = 20) private String status;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

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
        private String pathId;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

    /** 응답 */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
