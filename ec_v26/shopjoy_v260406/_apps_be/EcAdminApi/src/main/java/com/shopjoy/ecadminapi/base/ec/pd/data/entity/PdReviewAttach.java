package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

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
    private String reviewAttachId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("리뷰ID (pd_review.)")
    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Comment("첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회")
    @Column(name = "attach_id", length = 21, nullable = false)
    private String attachId;

    @Comment("미디어유형 (코드: MEDIA_TYPE)")
    @Column(name = "media_type_cd", length = 20)
    private String mediaTypeCd;

    @Comment("동영상 썸네일URL (이미지는 sy_attach.url 사용)")
    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
