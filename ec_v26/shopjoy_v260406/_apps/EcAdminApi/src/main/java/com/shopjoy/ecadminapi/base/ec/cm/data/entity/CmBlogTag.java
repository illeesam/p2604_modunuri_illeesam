package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cm_blog_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 태그 엔티티
public class CmBlogTag extends BaseEntity {

    @Id
    @Column(name = "blog_tag_id", length = 21, nullable = false)
    private String blogTagId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Column(name = "tag_nm", length = 50, nullable = false)
    private String tagNm;

    @Column(name = "sort_ord")
    private Integer sortOrd;

}
