package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_bltn", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시물 엔티티
public class CmBltn {

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

    @Lob
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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}