package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

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
@Table(name = "cm_blog_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 태그 엔티티
@Comment("블로그 태그")
public class CmBlogTag extends BaseEntity {

    @Id
    @Comment("태그ID")
    @Column(name = "blog_tag_id", length = 21, nullable = false)
    @Size(max = 21, message = "blogTagId 는 21자 이내여야 합니다.")
    private String blogTagId;


    @Comment("블로그ID")
    @Column(name = "blog_id", length = 21, nullable = false)
    @Size(max = 21, message = "blogId 는 21자 이내여야 합니다.")
    private String blogId;

    @Comment("태그명")
    @Column(name = "tag_nm", length = 50, nullable = false)
    @Size(max = 50, message = "tagNm 는 50자 이내여야 합니다.")
    private String tagNm;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
