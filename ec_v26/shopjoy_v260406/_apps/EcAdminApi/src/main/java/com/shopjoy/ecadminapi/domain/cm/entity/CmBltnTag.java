package com.shopjoy.ecadminapi.domain.cm.entity;

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
public class CmBltnTag {

    @Id
    @Column(name = "blog_tag_id", length = 20, nullable = false)
    private String blogTagId;

    @Column(name = "site_id", length = 20)
    private String siteId;

    @Column(name = "blog_id", length = 20, nullable = false)
    private String blogId;

    @Column(name = "tag_nm", length = 50, nullable = false)
    private String tagNm;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "reg_by", length = 20)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 20)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}