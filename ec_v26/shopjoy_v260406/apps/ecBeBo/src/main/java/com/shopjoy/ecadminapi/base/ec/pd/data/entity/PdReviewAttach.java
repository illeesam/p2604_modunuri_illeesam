package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_review_attach", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 리뷰 첨부파일 엔티티
@Comment("리뷰 이미지/동영상")
public class PdReviewAttach extends BaseEntity {

    @Id
    @Comment("미디어ID")
    @Column(name = "review_attach_id", length = 21, nullable = false)
    @Size(max = 21, message = "reviewAttachId 는 21자 이내여야 합니다.")
    private String reviewAttachId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("리뷰ID (pd_review.)")
    @Column(name = "review_id", length = 21, nullable = false)
    @Size(max = 21, message = "reviewId 는 21자 이내여야 합니다.")
    private String reviewId;

    @Comment("첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회")
    @Column(name = "attach_id", length = 21, nullable = false)
    @Size(max = 21, message = "attachId 는 21자 이내여야 합니다.")
    private String attachId;

    @Comment("미디어유형 (코드: MEDIA_TYPE_CD)")
    @Column(name = "media_type_cd", length = 20)
    @Size(max = 20, message = "mediaTypeCd 는 20자 이내여야 합니다.")
    private String mediaTypeCd;

    @Comment("동영상 썸네일URL (이미지는 sy_attach.url 사용)")
    @Column(name = "thumb_url", length = 500)
    @Size(max = 500, message = "thumbUrl 는 500자 이내여야 합니다.")
    private String thumbUrl;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
