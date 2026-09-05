package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "codeId 는 21자 이내여야 합니다.")
    private String codeId;


    @Column(name = "code_grp_id", length = 50)
    @Size(max = 50, message = "codeGrpId 는 50자 이내여야 합니다.")
    private String codeGrpId;

    @Column(name = "code_grp", length = 50)
    @Size(max = 50, message = "codeGrp 는 50자 이내여야 합니다.")
    private String codeGrp;

    @Column(name = "code_value", length = 50, nullable = false)
    @Size(max = 50, message = "codeValue 는 50자 이내여야 합니다.")
    private String codeValue;

    @Column(name = "code_label", length = 100, nullable = false)
    @Size(max = 100, message = "codeLabel 는 100자 이내여야 합니다.")
    private String codeLabel;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Column(name = "parent_code_value", length = 50)
    @Size(max = 50, message = "parentCodeValue 는 50자 이내여야 합니다.")
    private String parentCodeValue;

    @Column(name = "child_code_values", length = 500)
    @Size(max = 500, message = "childCodeValues 는 500자 이내여야 합니다.")
    private String childCodeValues;

    @Column(name = "code_remark", length = 300)
    @Size(max = 300, message = "codeRemark 는 300자 이내여야 합니다.")
    private String codeRemark;

    @Column(name = "code_level")
    private Integer codeLevel;

    @Column(name = "code_opt1", length = 200)
    @Size(max = 200, message = "codeOpt1 는 200자 이내여야 합니다.")
    private String codeOpt1;

    @Column(name = "reg_by", length = 50)
    @Size(max = 50, message = "regBy 는 50자 이내여야 합니다.")
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 50)
    @Size(max = 50, message = "updBy 는 50자 이내여야 합니다.")
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
