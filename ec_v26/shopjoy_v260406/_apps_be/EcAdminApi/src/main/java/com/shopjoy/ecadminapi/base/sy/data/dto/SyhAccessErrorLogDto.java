package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhAccessErrorLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 10) private String method;
        @Size(max = 200) private String path;
        @Size(max = 20) private String appTypeCd;
        @Size(max = 200) private String uiNm;
        @Size(max = 100) private String traceId;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_access_error_log ────────────────────────────────────
        private String logId;

        private String reqMethod;
        private String reqHost;
        private String reqPath;
        private String reqQuery;
        private String reqIp;
        private String reqUa;

        private String appTypeCd;
        private String userId;
        private String roleId;
        private String deptId;
        private String vendorId;
        private String localeId;

        private Long   respTimeMs;

        private String errorType;
        private String errorMsg;
        private String stackTrace;

        private String uiNm;
        private String cmdNm;
        private String fileNm;
        private String funcNm;
        private String lineNo;
        private String traceId;

        private String serverNm;
        private String profile;
        private String threadNm;
        private String loggerNm;

        private LocalDateTime logDt;
        private LocalDateTime regDate;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
