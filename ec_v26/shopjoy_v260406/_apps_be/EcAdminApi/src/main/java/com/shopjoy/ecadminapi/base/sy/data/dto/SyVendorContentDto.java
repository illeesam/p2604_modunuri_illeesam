package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyVendorContentDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String vendorContentId;
        @Size(max = 50) private String contentTypeCd;
        @Size(max = 20) private String status;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_content ──────────────────────────────────────────
        private String vendorContentId;
        private String siteId;
        private String vendorId;
        private String contentTypeCd;
        private String vendorContentTitle;
        private String vendorContentSubtitle;
        private String contentHtml;
        private String thumbUrl;
        private String imageUrl;
        private String linkUrl;
        private String attachGrpId;
        private String langCd;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private Integer sortOrd;
        private String vendorContentStatusCd;
        private String useYn;
        private Integer viewCount;
        private String vendorContentRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
