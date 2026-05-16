package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 역할(권한) 엔티티
@Comment("역할 (권한그룹)")
public class SyRole extends BaseEntity {

    @Id
    @Comment("역할ID (YYMMDDhhmmss+rand4)")
    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("역할코드")
    @Column(name = "role_code", length = 50, nullable = false)
    private String roleCode;

    @Comment("역할명")
    @Column(name = "role_nm", length = 100, nullable = false)
    private String roleNm;

    @Comment("상위역할ID")
    @Column(name = "parent_role_id", length = 21)
    private String parentRoleId;

    @Comment("역할유형 (코드: ROLE_TYPE — SYSTEM/CUSTOM)")
    @Column(name = "role_type_cd", length = 20)
    private String roleTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("제한권한여부 Y/N")
    @Column(name = "restrict_perm", length = 1)
    private String restrictPerm;

    @Comment("비고")
    @Column(name = "role_remark", length = 300)
    private String roleRemark;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
