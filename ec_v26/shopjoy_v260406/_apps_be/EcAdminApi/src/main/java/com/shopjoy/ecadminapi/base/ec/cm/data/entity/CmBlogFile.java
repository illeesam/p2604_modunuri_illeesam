package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_blog_file", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 첨부파일 엔티티
@Comment("블로그 이미지")
public class CmBlogFile extends BaseEntity {

    @Id
    @Comment("블로그이미지ID")
    @Column(name = "blog_img_id", length = 21, nullable = false)
    private String blogImgId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("블로그ID (cm_bltn.)")
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Comment("원본 이미지 URL")
    @Column(name = "img_url", length = 500, nullable = false)
    private String imgUrl;

    @Comment("썸네일 이미지 URL")
    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Comment("이미지 대체텍스트")
    @Column(name = "img_alt_text", length = 200)
    private String imgAltText;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
