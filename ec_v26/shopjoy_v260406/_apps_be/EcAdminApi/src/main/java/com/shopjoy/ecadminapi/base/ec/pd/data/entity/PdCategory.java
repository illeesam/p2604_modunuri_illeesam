package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_category", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 카테고리 엔티티
@Comment("카테고리")
public class PdCategory extends BaseEntity {

    @Id
    @Comment("카테고리ID (YYMMDDhhmmss+rand4)")
    @Column(name = "category_id", length = 21, nullable = false)
    private String categoryId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상위 카테고리ID")
    @Column(name = "parent_category_id", length = 21)
    private String parentCategoryId;

    @Comment("카테고리명")
    @Column(name = "category_nm", length = 100, nullable = false)
    private String categoryNm;

    @Comment("깊이 (1:대/2:중/3:소)")
    @Column(name = "category_depth")
    private Integer categoryDepth;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("상태 (코드: USE_YN)")
    @Column(name = "category_status_cd", length = 20)
    private String categoryStatusCd;

    @Comment("변경 전 카테고리상태 (코드: USE_YN)")
    @Column(name = "category_status_cd_before", length = 20)
    private String categoryStatusCdBefore;

    @Comment("이미지URL")
    @Column(name = "img_url", length = 500)
    private String imgUrl;

    @Comment("설명")
    @Column(name = "category_desc", columnDefinition = "TEXT")
    private String categoryDesc;

}
