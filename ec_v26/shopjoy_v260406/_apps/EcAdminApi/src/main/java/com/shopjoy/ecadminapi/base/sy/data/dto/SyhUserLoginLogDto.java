package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyhUserLoginLogDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21)  private String siteId;
        @Size(max = 21)  private String logId;
        @Size(max = 21)  private String userId;
        @Size(max = 20)  private String resultCd;
        @Size(max = 50)  private String ip;
        @Size(max = 200) private String uiNm;
        @Size(max = 100) private String traceId;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── syh_user_login_log ──────────────────────────────────────────
        private String logId;
        private String siteId;
        private String userId;
        private String loginId;
        private LocalDateTime loginDate;
        private String resultCd;
        private Integer failCnt;
        private String ip;
        private String device;
        private String os;
        private String browser;
        private String accessToken;
        private LocalDateTime accessTokenExp;
        private String refreshToken;
        private LocalDateTime refreshTokenExp;
        private String uiNm;
        private String cmdNm;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────────
        private String siteNm;
        private String userNm;
        private String resultCdNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
