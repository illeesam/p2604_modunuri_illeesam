package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "zz_sample3", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class ZzSample3 extends BaseEntity {

    @Id
    @Column(name = "sample3_id", length = 20, nullable = false)
    @Size(max = 20, message = "sample3Id 는 20자 이내여야 합니다.")
    private String sample3Id;

    @Column(name = "cd_grp", length = 50)
    @Size(max = 50, message = "cdGrp 는 50자 이내여야 합니다.")
    private String cdGrp;

    @Column(name = "cd_vl", length = 20)
    @Size(max = 20, message = "cdVl 는 20자 이내여야 합니다.")
    private String cdVl;

    @Column(name = "cd_nm", length = 200)
    @Size(max = 200, message = "cdNm 는 200자 이내여야 합니다.")
    private String cdNm;

    @Column(name = "srtord_vl")
    private BigDecimal srtordVl;

    @Column(name = "attr_nm1", length = 200)
    @Size(max = 200, message = "attrNm1 는 200자 이내여야 합니다.")
    private String attrNm1;

    @Column(name = "attr_nm2", length = 200)
    @Size(max = 200, message = "attrNm2 는 200자 이내여야 합니다.")
    private String attrNm2;

    @Column(name = "attr_nm3", length = 200)
    @Size(max = 200, message = "attrNm3 는 200자 이내여야 합니다.")
    private String attrNm3;

    @Column(name = "attr_nm4", length = 200)
    @Size(max = 200, message = "attrNm4 는 200자 이내여야 합니다.")
    private String attrNm4;

    @Column(name = "expln_cn", length = 2000)
    @Size(max = 2000, message = "explnCn 는 2000자 이내여야 합니다.")
    private String explnCn;

    @Column(name = "cd_infw_se_cd", length = 20)
    @Size(max = 20, message = "cdInfwSeCd 는 20자 이내여야 합니다.")
    private String cdInfwSeCd;

    @Column(name = "use_yn", length = 20)
    @Size(max = 20, message = "useYn 는 20자 이내여야 합니다.")
    private String useYn;

    @Column(name = "group_cd", length = 200)
    @Size(max = 200, message = "groupCd 는 200자 이내여야 합니다.")
    private String groupCd;

    @Column(name = "col01", length = 200)
    @Size(max = 200, message = "col01 는 200자 이내여야 합니다.")
    private String col01;

    @Column(name = "col02", length = 200)
    @Size(max = 200, message = "col02 는 200자 이내여야 합니다.")
    private String col02;

    @Column(name = "col03", length = 200)
    @Size(max = 200, message = "col03 는 200자 이내여야 합니다.")
    private String col03;

    @Column(name = "col04", length = 200)
    @Size(max = 200, message = "col04 는 200자 이내여야 합니다.")
    private String col04;

    @Column(name = "col05", length = 200)
    @Size(max = 200, message = "col05 는 200자 이내여야 합니다.")
    private String col05;

    @Column(name = "col06", length = 200)
    @Size(max = 200, message = "col06 는 200자 이내여야 합니다.")
    private String col06;

    @Column(name = "col07", length = 200)
    @Size(max = 200, message = "col07 는 200자 이내여야 합니다.")
    private String col07;

    @Column(name = "col08", length = 200)
    @Size(max = 200, message = "col08 는 200자 이내여야 합니다.")
    private String col08;

    @Column(name = "col09", length = 200)
    @Size(max = 200, message = "col09 는 200자 이내여야 합니다.")
    private String col09;

    @Column(name = "status_cd", length = 20)
    @Size(max = 20, message = "statusCd 는 20자 이내여야 합니다.")
    private String statusCd;

    @Column(name = "type_cd", length = 20)
    @Size(max = 20, message = "typeCd 는 20자 이내여야 합니다.")
    private String typeCd;

    @Column(name = "div_cd", length = 20)
    @Size(max = 20, message = "divCd 는 20자 이내여야 합니다.")
    private String divCd;

    @Column(name = "kind_cd", length = 20)
    @Size(max = 20, message = "kindCd 는 20자 이내여야 합니다.")
    private String kindCd;

    @Column(name = "cate_cds", length = 100)
    @Size(max = 100, message = "cateCds 는 100자 이내여야 합니다.")
    private String cateCds;

    @Column(name = "sample1_id", length = 21)
    @Size(max = 21, message = "sample1Id 는 21자 이내여야 합니다.")
    private String sample1Id;

    @Column(name = "sample2_id", length = 21)
    @Size(max = 21, message = "sample2Id 는 21자 이내여야 합니다.")
    private String sample2Id;
}
