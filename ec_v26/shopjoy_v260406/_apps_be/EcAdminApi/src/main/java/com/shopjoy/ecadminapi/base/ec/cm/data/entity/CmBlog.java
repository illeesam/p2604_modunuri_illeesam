package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cm_blog", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 엔티티
public class CmBlog extends BaseEntity {

    @Id
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "blog_cate_id", length = 21)
    private String blogCateId;

    @Column(name = "blog_title", length = 200, nullable = false)
    private String blogTitle;

    @Column(name = "blog_summary", length = 500)
    private String blogSummary;

    @Column(name = "blog_content", columnDefinition = "TEXT")
    private String blogContent;

    @Column(name = "blog_author", length = 100)
    private String blogAuthor;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "is_notice", length = 1)
    private String isNotice;

}
