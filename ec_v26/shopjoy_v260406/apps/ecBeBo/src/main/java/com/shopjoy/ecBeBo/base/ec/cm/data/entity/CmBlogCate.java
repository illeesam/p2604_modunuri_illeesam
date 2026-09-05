package com.shopjoy.ecBeBo.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "blogCateId 는 21자 이내여야 합니다.")
    private String blogCateId;


    @Comment("카테고리명")
    @Column(name = "blog_cate_nm", length = 100, nullable = false)
    @Size(max = 100, message = "blogCateNm 는 100자 이내여야 합니다.")
    private String blogCateNm;

    @Comment("상위 카테고리ID (NULL이면 최상위)")
    @Column(name = "parent_blog_cate_id", length = 21)
    @Size(max = 21, message = "parentBlogCateId 는 21자 이내여야 합니다.")
    private String parentBlogCateId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
