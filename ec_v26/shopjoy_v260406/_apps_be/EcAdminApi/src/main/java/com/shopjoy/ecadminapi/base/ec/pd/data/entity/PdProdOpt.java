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
@Table(name = "pd_prod_opt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션 엔티티
@Comment("상품 옵션 (색상, 사이즈 등 옵션 차원)")
public class PdProdOpt extends BaseEntity {

    @Id
    @Comment("옵션ID")
    @Column(name = "opt_id", length = 21, nullable = false)
    private String optId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("옵션명 (예: 색상, 사이즈)")
    @Column(name = "opt_grp_nm", length = 50, nullable = false)
    private String optGrpNm;

    @Comment("옵션 차원 순서 — 1=첫번째(색상), 2=두번째(사이즈)")
    @Column(name = "opt_level", nullable = false)
    private Integer optLevel;

    @Comment("옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)")
    @Column(name = "opt_type_cd", length = 20)
    private String optTypeCd;

    @Comment("옵션입력방식 (코드: OPT_INPUT_TYPE — SELECT/SELECT_INPUT/MULTI_SELECT)")
    @Column(name = "opt_input_type_cd", length = 20)
    private String optInputTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

}
