package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_prod_rel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 연관 상품 엔티티
public class PdProdRel extends BaseEntity {

    @Id
    @Column(name = "prod_rel_id", length = 21, nullable = false)
    private String prodRelId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "rel_prod_id", length = 21, nullable = false)
    private String relProdId;

    @Column(name = "prod_rel_type_cd", length = 20, nullable = false)
    private String prodRelTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

}
