package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_category_prod", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 카테고리-상품 매핑 엔티티
@Comment("상품-카테고리 연결 (N:N, 복수 카테고리·타입 등록)")
public class PdCategoryProd extends BaseEntity {

    @Id
    @Comment("상품카테고리연결ID (YYMMDDhhmmss+rand4)")
    @Column(name = "category_prod_id", length = 21, nullable = false)
    private String categoryProdId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("카테고리ID (pd_category.category_id)")
    @Column(name = "category_id", length = 21, nullable = false)
    private String categoryId;

    @Comment("상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("진열유형 (NORMAL/HIGHLIGHT/RECOMMEND/MAIN/BANNER/HOT_DEAL)")
    @Column(name = "category_prod_type_cd", length = 20, nullable = false)
    private String categoryProdTypeCd;

    @Comment("표시 순서 (동일 타입 내, 낮을수록 우선 노출)")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "emphasis_cd", length = 200)
    private String emphasisCd;

    @Comment("전시여부 (Y=전시, N=비전시)")
    @Column(name = "disp_yn", length = 1, nullable = false)
    private String dispYn;

    @Comment("전시시작일 (NULL=즉시)")
    @Column(name = "disp_start_date")
    private LocalDate dispStartDate;

    @Comment("전시종료일 (NULL=무기한, 기본 3년 후 12월31일)")
    @Column(name = "disp_end_date")
    private LocalDate dispEndDate;

}
