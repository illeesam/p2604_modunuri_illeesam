package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_bltn_cate", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시판 카테고리 엔티티
public class CmBltnCate {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}