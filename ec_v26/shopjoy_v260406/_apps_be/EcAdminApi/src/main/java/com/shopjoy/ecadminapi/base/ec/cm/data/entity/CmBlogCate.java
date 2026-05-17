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
@Table(name = "cm_blog_cate", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 카테고리 엔티티
@Comment("블로그 카테고리")
public class CmBlogCate extends BaseEntity {

    @Id
    @Comment("블로그카테고리ID")
    @Column(name = "blog_cate_id", length = 21, nullable = false)
    private String blogCateId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("카테고리명")
    @Column(name = "blog_cate_nm", length = 100, nullable = false)
    private String blogCateNm;

    @Comment("상위 카테고리ID (NULL이면 최상위)")
    @Column(name = "parent_blog_cate_id", length = 21)
    private String parentBlogCateId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
