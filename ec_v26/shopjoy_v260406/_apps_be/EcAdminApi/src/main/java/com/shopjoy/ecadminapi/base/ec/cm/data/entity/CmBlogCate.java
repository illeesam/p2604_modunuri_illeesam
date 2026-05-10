package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cm_blog_cate", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 카테고리 엔티티
public class CmBlogCate extends BaseEntity {

    @Id
    @Column(name = "blog_cate_id", length = 21, nullable = false)
    private String blogCateId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "blog_cate_nm", length = 100, nullable = false)
    private String blogCateNm;

    @Column(name = "parent_blog_cate_id", length = 21)
    private String parentBlogCateId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
