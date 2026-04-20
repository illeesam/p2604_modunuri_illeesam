package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_code", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 공통 코드 엔티티
public class SyCode {

    @Id
    @Column(name = "code_id", length = 21, nullable = false)
    private String codeId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "code_grp", length = 50, nullable = false)
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

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}