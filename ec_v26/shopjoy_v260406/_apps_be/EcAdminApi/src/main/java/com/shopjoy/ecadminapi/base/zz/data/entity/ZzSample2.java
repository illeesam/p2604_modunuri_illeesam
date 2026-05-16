package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "zz_sample2", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("다목적 샘플/코드성 데이터 저장소 2")
public class ZzSample2 extends BaseEntity {

    @Id
    @Comment("샘플2 ID (ZS2+YYMMDDHHmmss+rand4)")
    @Column(name = "sample2_id", length = 21, nullable = false)
    private String sample2Id;

    @Comment("도메인 구분 키")
    @Column(name = "cd_grp", length = 50)
    private String cdGrp;

    @Comment("코드 값")
    @Column(name = "cd_vl", length = 20)
    private String cdVl;

    @Comment("코드명 / 대표 텍스트")
    @Column(name = "cd_nm", length = 200)
    private String cdNm;

    @Comment("정렬 순서")
    @Column(name = "srtord_vl")
    private BigDecimal srtordVl;

    @Comment("속성명1")
    @Column(name = "attr_nm1", length = 200)
    private String attrNm1;

    @Comment("속성명2")
    @Column(name = "attr_nm2", length = 200)
    private String attrNm2;

    @Comment("속성명3")
    @Column(name = "attr_nm3", length = 200)
    private String attrNm3;

    @Comment("속성명4")
    @Column(name = "attr_nm4", length = 200)
    private String attrNm4;

    @Comment("설명 내용")
    @Column(name = "expln_cn", length = 2000)
    private String explnCn;

    @Comment("코드 유입 구분 코드")
    @Column(name = "cd_infw_se_cd", length = 20)
    private String cdInfwSeCd;

    @Comment("사용 여부 (Y/N)")
    @Column(name = "use_yn", length = 20)
    private String useYn;

    @Comment("그룹 코드")
    @Column(name = "group_cd", length = 200)
    private String groupCd;

    @Comment("범용 컬럼01")
    @Column(name = "col01", length = 200)
    private String col01;

    @Comment("범용 컬럼02")
    @Column(name = "col02", length = 200)
    private String col02;

    @Comment("범용 컬럼03")
    @Column(name = "col03", length = 200)
    private String col03;

    @Comment("범용 컬럼04")
    @Column(name = "col04", length = 200)
    private String col04;

    @Comment("범용 컬럼05")
    @Column(name = "col05", length = 200)
    private String col05;

    @Comment("범용 컬럼06")
    @Column(name = "col06", length = 200)
    private String col06;

    @Comment("범용 컬럼07")
    @Column(name = "col07", length = 200)
    private String col07;

    @Comment("범용 컬럼08")
    @Column(name = "col08", length = 200)
    private String col08;

    @Comment("범용 컬럼09")
    @Column(name = "col09", length = 200)
    private String col09;

    @Comment("상태 코드")
    @Column(name = "status_cd", length = 20)
    private String statusCd;

    @Comment("유형 코드")
    @Column(name = "type_cd", length = 20)
    private String typeCd;

    @Comment("구분 코드")
    @Column(name = "div_cd", length = 20)
    private String divCd;

    @Comment("종류 코드")
    @Column(name = "kind_cd", length = 20)
    private String kindCd;

    @Comment("카테고리 코드 목록")
    @Column(name = "cate_cds", length = 100)
    private String cateCds;

    @Column(name = "sample1_id", length = 21)
    private String sample1Id;
}
