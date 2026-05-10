package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "zz_sample1", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample1 {

    @Id
    @Column(name = "sample1_id", length = 20, nullable = false)
    private String sample1Id;

    @Column(name = "cd_grp", length = 50)
    private String cdGrp;

    @Column(name = "cd_vl", length = 20)
    private String cdVl;

    @Column(name = "cd_nm", length = 200)
    private String cdNm;

    @Column(name = "srtord_vl")
    private BigDecimal srtordVl;

    @Column(name = "attr_nm1", length = 200)
    private String attrNm1;

    @Column(name = "attr_nm2", length = 200)
    private String attrNm2;

    @Column(name = "attr_nm3", length = 200)
    private String attrNm3;

    @Column(name = "attr_nm4", length = 200)
    private String attrNm4;

    @Column(name = "expln_cn", length = 2000)
    private String explnCn;

    @Column(name = "cd_infw_se_cd", length = 20)
    private String cdInfwSeCd;

    @Column(name = "use_yn", length = 20)
    private String useYn;

    @Column(name = "rgtr", length = 20)
    private String rgtr;

    @Column(name = "reg_dt")
    private LocalDate regDt;

    @Column(name = "mdfr", length = 20)
    private String mdfr;

    @Column(name = "mdfcn_dt")
    private LocalDate mdfcnDt;

    @Column(name = "group_cd", length = 200)
    private String groupCd;

    @Column(name = "col01", length = 200)
    private String col01;

    @Column(name = "col02", length = 200)
    private String col02;

    @Column(name = "col03", length = 200)
    private String col03;

    @Column(name = "col04", length = 200)
    private String col04;

    @Column(name = "col05", length = 200)
    private String col05;

    @Column(name = "col06", length = 200)
    private String col06;

    @Column(name = "col07", length = 200)
    private String col07;

    @Column(name = "col08", length = 200)
    private String col08;

    @Column(name = "col09", length = 200)
    private String col09;

    @Column(name = "status_cd", length = 20)
    private String statusCd;

    @Column(name = "type_cd", length = 20)
    private String typeCd;

    @Column(name = "div_cd", length = 20)
    private String divCd;

    @Column(name = "kind_cd", length = 20)
    private String kindCd;

    @Column(name = "cate_cds", length = 100)
    private String cateCds;
}
