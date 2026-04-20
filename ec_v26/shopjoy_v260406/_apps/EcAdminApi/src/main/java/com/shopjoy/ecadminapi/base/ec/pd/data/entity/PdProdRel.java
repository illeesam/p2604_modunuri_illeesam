package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_rel", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 연관 상품 엔티티
public class PdProdRel {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}