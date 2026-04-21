package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "zz_sample0", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample0 {

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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
