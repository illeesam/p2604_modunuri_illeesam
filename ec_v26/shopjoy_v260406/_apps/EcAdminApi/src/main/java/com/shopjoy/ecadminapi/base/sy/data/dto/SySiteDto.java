package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SySiteDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String pathId;
        @Size(max = 20) private String status;
        @Size(max = 20) private String typeCd;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_site ──────────────────────────────────────────
        private String siteId;
        private String siteCode;
        private String siteTypeCd;
        private String siteNm;
        private String siteDomain;
        private String logoUrl;
        private String faviconUrl;
        private String siteDesc;
        private String siteEmail;
        private String sitePhone;
        private String siteZipCode;
        private String siteAddress;
        private String siteBusinessNo;
        private String siteCeo;
        private String siteStatusCd;
        private String configJson;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String pathId;

        // ── JOIN ──────────────────────────────────────────────
        private String siteTypeCdNm;
        private String siteStatusCdNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
