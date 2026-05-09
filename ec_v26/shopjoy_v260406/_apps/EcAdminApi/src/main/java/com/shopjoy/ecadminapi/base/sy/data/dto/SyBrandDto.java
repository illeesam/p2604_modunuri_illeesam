package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBrandDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 ────────────────────────
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String brandId;
        @Size(max = 21) private String pathId;
        @Size(max = 21) private String vendorId;
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_brand ──────────────────────────────────────────
        private String brandId;
        private String siteId;
        private String brandCode;
        private String brandNm;
        private String brandEnNm;
        private String pathId;
        private String logoUrl;
        private String vendorId;
        private Integer sortOrd;
        private String useYn;
        private String brandRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
        private String vendorNm;
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
