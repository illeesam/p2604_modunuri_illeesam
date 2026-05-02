package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "zz_sample0", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class ZzSample0 extends BaseEntity {

    @Id
    @Column(name = "sample0_id", length = 21, nullable = false)
    private String sample0Id;

    @Column(name = "sample_name", length = 100, nullable = false)
    private String sampleName;

    @Column(name = "sample_desc", length = 500)
    private String sampleDesc;

    @Column(name = "sample_value", length = 100)
    private String sampleValue;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

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
}
