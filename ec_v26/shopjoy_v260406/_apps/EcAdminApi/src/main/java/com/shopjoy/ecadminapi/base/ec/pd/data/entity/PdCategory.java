package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_category", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 카테고리 엔티티
public class PdCategory {

    @Id
    @Column(name = "category_id", length = 21, nullable = false)
    private String categoryId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "parent_category_id", length = 21)
    private String parentCategoryId;

    @Column(name = "category_nm", length = 100, nullable = false)
    private String categoryNm;

    @Column(name = "category_depth")
    private Integer categoryDepth;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "category_status_cd", length = 20)
    private String categoryStatusCd;

    @Column(name = "category_status_cd_before", length = 20)
    private String categoryStatusCdBefore;

    @Column(name = "img_url", length = 500)
    private String imgUrl;

    @Lob
    @Column(name = "category_desc", columnDefinition = "TEXT")
    private String categoryDesc;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}