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
@Table(name = "cm_blog_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 태그 엔티티
@Comment("블로그 태그")
public class CmBlogTag extends BaseEntity {

    @Id
    @Comment("태그ID")
    @Column(name = "blog_tag_id", length = 21, nullable = false)
    private String blogTagId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("블로그ID")
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Comment("태그명")
    @Column(name = "tag_nm", length = 50, nullable = false)
    private String tagNm;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
