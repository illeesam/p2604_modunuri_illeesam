package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_vendor_content", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 업체 콘텐츠 엔티티
public class SyVendorContent {

    @Id
    @Column(name = "vendor_content_id", length = 21, nullable = false)
    private String vendorContentId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "content_type_cd", length = 30, nullable = false)
    private String contentTypeCd;

    @Column(name = "vendor_content_title", length = 200)
    private String vendorContentTitle;

    @Column(name = "vendor_content_subtitle", length = 300)
    private String vendorContentSubtitle;

    @Lob
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Column(name = "lang_cd", length = 10)
    private String langCd;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "vendor_content_status_cd", length = 20)
    private String vendorContentStatusCd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "vendor_content_remark", length = 500)
    private String vendorContentRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}