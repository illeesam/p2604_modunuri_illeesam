package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_category_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 카테고리-상품 매핑 엔티티
public class PdCategoryProd {

    @Id
    @Column(name = "category_prod_id", length = 21, nullable = false)
    private String categoryProdId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "category_id", length = 21, nullable = false)
    private String categoryId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "category_prod_type_cd", length = 20, nullable = false)
    private String categoryProdTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "emphasis_cd", length = 200)
    private String emphasisCd;

    @Column(name = "disp_yn", length = 1, nullable = false)
    private String dispYn;

    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}