package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_vendor_content", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체 콘텐츠 엔티티
@Comment("판매/배송업체 콘텐츠 (회사소개/배너/약관 등)")
public class SyVendorContent extends BaseEntity {

    @Id
    @Comment("업체콘텐츠ID (PK)")
    @Column(name = "vendor_content_id", length = 21, nullable = false)
    private String vendorContentId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("콘텐츠유형 (코드: VENDOR_CONTENT_TYPE)")
    @Column(name = "content_type_cd", length = 30, nullable = false)
    private String contentTypeCd;

    @Comment("제목")
    @Column(name = "vendor_content_title", length = 200)
    private String vendorContentTitle;

    @Comment("부제")
    @Column(name = "vendor_content_subtitle", length = 300)
    private String vendorContentSubtitle;

    @Comment("본문 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("썸네일 URL")
    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Comment("대표 이미지 URL")
    @Column(name = "image_url", length = 500)
    private String imageUrl;

    @Comment("링크 URL")
    @Column(name = "link_url", length = 500)
    private String linkUrl;

    @Comment("첨부파일그룹ID (sy_attach_grp.attach_grp_id)")
    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Comment("언어코드 (ko/en/ja)")
    @Column(name = "lang_cd", length = 10)
    private String langCd;

    @Comment("노출 시작일시")
    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Comment("노출 종료일시")
    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("상태 (코드: VENDOR_CONTENT_STATUS)")
    @Column(name = "vendor_content_status_cd", length = 20)
    private String vendorContentStatusCd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("비고")
    @Column(name = "vendor_content_remark", length = 500)
    private String vendorContentRemark;

}
