package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_prod_opt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 상품 옵션 엔티티
public class PdProdOpt {

    @Id
    @Column(name = "opt_id", length = 21, nullable = false)
    private String optId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Column(name = "opt_grp_nm", length = 50, nullable = false)
    private String optGrpNm;

    @Column(name = "opt_level", nullable = false)
    private Integer optLevel;

    @Column(name = "opt_type_cd", length = 20)
    private String optTypeCd;

    @Column(name = "opt_input_type_cd", length = 20)
    private String optInputTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}