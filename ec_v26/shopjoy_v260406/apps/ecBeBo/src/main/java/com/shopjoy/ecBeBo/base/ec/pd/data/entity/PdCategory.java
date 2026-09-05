package com.shopjoy.ecBeBo.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "categoryId 는 21자 이내여야 합니다.")
    private String categoryId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("상위 카테고리ID")
    @Column(name = "parent_category_id", length = 21)
    @Size(max = 21, message = "parentCategoryId 는 21자 이내여야 합니다.")
    private String parentCategoryId;

    @Comment("카테고리명")
    @Column(name = "category_nm", length = 100, nullable = false)
    @Size(max = 100, message = "categoryNm 는 100자 이내여야 합니다.")
    private String categoryNm;

    @Comment("깊이 (1:대/2:중/3:소)")
    @Column(name = "category_depth")
    private Integer categoryDepth;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("상태 (코드: CATEGORY_STATUS_CD)")
    @Column(name = "category_status_cd", length = 20)
    @Size(max = 20, message = "categoryStatusCd 는 20자 이내여야 합니다.")
    private String categoryStatusCd;

    @Comment("변경 전 카테고리상태 (코드: CATEGORY_STATUS_CD)")
    @Column(name = "category_status_cd_before", length = 20)
    @Size(max = 20, message = "categoryStatusCdBefore 는 20자 이내여야 합니다.")
    private String categoryStatusCdBefore;

    @Comment("이미지URL")
    @Column(name = "img_url", length = 500)
    @Size(max = 500, message = "imgUrl 는 500자 이내여야 합니다.")
    private String imgUrl;

    @Comment("설명")
    @Column(name = "category_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "categoryDesc 는 500,000자 이내여야 합니다.")
    private String categoryDesc;

}
