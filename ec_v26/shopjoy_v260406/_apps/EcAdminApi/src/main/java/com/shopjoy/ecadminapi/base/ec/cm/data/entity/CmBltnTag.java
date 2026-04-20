package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_bltn_tag", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시물 태그 엔티티
public class CmBltnTag {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}