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
@Table(name = "pd_prod_rel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 연관 상품 엔티티
@Comment("상품 연관 관계 (연관상품/코디상품)")
public class PdProdRel extends BaseEntity {

    @Id
    @Comment("연관관계ID (YYMMDDhhmmss+rand4)")
    @Column(name = "prod_rel_id", length = 21, nullable = false)
    private String prodRelId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("기준 상품ID (pd_prod.prod_id)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("연관 대상 상품ID (pd_prod.prod_id)")
    @Column(name = "rel_prod_id", length = 21, nullable = false)
    private String relProdId;

    @Comment("관계유형 코드 (PROD_REL_TYPE: REL_PROD/CODY_PROD)")
    @Column(name = "prod_rel_type_cd", length = 20, nullable = false)
    private String prodRelTypeCd;

    @Comment("정렬순서 (낮을수록 우선 노출)")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
