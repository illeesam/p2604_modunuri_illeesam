package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cm_blog_file", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 첨부파일 엔티티
public class CmBlogFile extends BaseEntity {

    @Id
    @Column(name = "blog_img_id", length = 21, nullable = false)
    private String blogImgId;

    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Column(name = "img_url", length = 500, nullable = false)
    private String imgUrl;

    @Column(name = "thumb_url", length = 500)
    private String thumbUrl;

    @Column(name = "img_alt_text", length = 200)
    private String imgAltText;

    @Column(name = "sort_ord")
    private Integer sortOrd;

}
