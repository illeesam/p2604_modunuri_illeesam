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
@Table(name = "pd_prod_opt_type", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션 유형 엔티티 (옵션 차원 정의: 색상, 사이즈 등)
@Comment("상품 옵션 유형 (색상, 사이즈 등 옵션 차원 정의)")
public class PdProdOptType extends BaseEntity {

    @Id
    @Comment("옵션유형ID")
    @Column(name = "prod_opt_type_id", length = 21, nullable = false)
    private String prodOptTypeId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("옵션유형명 (예: 색상, 사이즈)")
    @Column(name = "prod_opt_type_nm", length = 50, nullable = false)
    private String prodOptTypeNm;

    @Comment("옵션 차원 순서 — 1=첫번째(색상), 2=두번째(사이즈)")
    @Column(name = "prod_opt_type_level", nullable = false)
    private Integer prodOptTypeLevel;

    @Comment("옵션입력방식 코드 (OPT_INPUT_TYPE — SELECT/SELECT_INPUT/MULTI_SELECT 등)")
    @Column(name = "prod_opt_input_type_cd", length = 20)
    private String prodOptInputTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
