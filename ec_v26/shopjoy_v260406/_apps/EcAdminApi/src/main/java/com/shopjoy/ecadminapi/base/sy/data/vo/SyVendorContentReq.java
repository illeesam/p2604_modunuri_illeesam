package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendorContent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorContentReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public SyVendorContent toEntity() {
        return SyVendorContent.builder()
                .vendorContentId(vendorContentId)
                .siteId(siteId)
                .vendorId(vendorId)
                .contentTypeCd(contentTypeCd)
                .vendorContentTitle(vendorContentTitle)
                .vendorContentSubtitle(vendorContentSubtitle)
                .contentHtml(contentHtml)
                .thumbUrl(thumbUrl)
                .imageUrl(imageUrl)
                .linkUrl(linkUrl)
                .attachGrpId(attachGrpId)
                .langCd(langCd)
                .startDate(startDate)
                .endDate(endDate)
                .sortOrd(sortOrd)
                .vendorContentStatusCd(vendorContentStatusCd)
                .useYn(useYn)
                .viewCount(viewCount)
                .vendorContentRemark(vendorContentRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
