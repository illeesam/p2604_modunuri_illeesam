package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorContentDto {

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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
