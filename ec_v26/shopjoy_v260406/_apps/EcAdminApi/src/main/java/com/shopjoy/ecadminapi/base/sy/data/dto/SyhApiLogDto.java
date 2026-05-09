package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhApiLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String logId;
        @Size(max = 20) private String typeCd;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_api_log ──────────────────────────────────────────
        private String logId;
        private String siteId;
        private String apiTypeCd;
        private String apiNm;
        private String uiNm;
        private String cmdNm;
        private String methodCd;
        private String endpoint;
        private String reqBody;
        private String resBody;
        private Integer httpStatus;
        private String resultCd;
        private String errorMsg;
        private Integer elapsedMs;
        private String refTypeCd;
        private String refId;
        private LocalDateTime callDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
