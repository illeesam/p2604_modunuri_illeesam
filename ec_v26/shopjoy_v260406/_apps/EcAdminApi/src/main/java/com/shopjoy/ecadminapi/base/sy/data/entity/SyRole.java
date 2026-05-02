package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 역할(권한) 엔티티
public class SyRole extends BaseEntity {

    @Id
    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "role_code", length = 50, nullable = false)
    private String roleCode;

    @Column(name = "role_nm", length = 100, nullable = false)
    private String roleNm;

    @Column(name = "parent_role_id", length = 21)
    private String parentRoleId;

    @Column(name = "role_type_cd", length = 20)
    private String roleTypeCd;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "restrict_perm", length = 1)
    private String restrictPerm;

    @Column(name = "role_remark", length = 300)
    private String roleRemark;

    @Column(name = "path_id", length = 21)
    private String pathId;

}
