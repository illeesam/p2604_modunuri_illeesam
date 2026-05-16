package com.shopjoy.ecadminapi.base.zz.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "zz_sample0", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("ZzSample0 - 샘플 데이터 관리 테이블 0")
public class ZzSample0 extends BaseEntity {

    @Id
    @Comment("샘플0 ID (YYMMDDhhmmss+rand4)")
    @Column(name = "sample0_id", length = 21, nullable = false)
    private String sample0Id;

    @Comment("샘플 이름")
    @Column(name = "sample_name", length = 100, nullable = false)
    private String sampleName;

    @Comment("샘플 설명")
    @Column(name = "sample_desc", length = 500)
    private String sampleDesc;

    @Comment("샘플 값")
    @Column(name = "sample_value", length = 100)
    private String sampleValue;

    @Comment("정렬 순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용 여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

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
}
