package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

/**
 * vw_sy_code 뷰 엔티티 (READ-ONLY)
 * sy_code + sy_code_grp JOIN 뷰 — code_grp 텍스트를 code_grp_id FK 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_sy_code", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwSyCode {

    @Id
    @Column(name = "code_id", length = 21, nullable = false)
    private String codeId;


    @Column(name = "code_grp_id", length = 50)
    private String codeGrpId;

    @Column(name = "code_grp", length = 50)
    private String codeGrp;

    @Column(name = "code_value", length = 50, nullable = false)
    private String codeValue;

    @Column(name = "code_label", length = 100, nullable = false)
    private String codeLabel;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "parent_code_value", length = 50)
    private String parentCodeValue;

    @Column(name = "child_code_values", length = 500)
    private String childCodeValues;

    @Column(name = "code_remark", length = 300)
    private String codeRemark;

    @Column(name = "code_level")
    private Integer codeLevel;

    @Column(name = "code_opt1", length = 200)
    private String codeOpt1;

    @Column(name = "reg_by", length = 50)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 50)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
