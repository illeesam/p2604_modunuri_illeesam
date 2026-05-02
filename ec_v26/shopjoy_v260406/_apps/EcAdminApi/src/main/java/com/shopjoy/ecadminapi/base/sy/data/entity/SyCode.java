package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_code", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class SyCode extends BaseEntity {

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

}
