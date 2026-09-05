package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;


    @Comment("역할코드")
    @Column(name = "role_code", length = 50, nullable = false)
    @Size(max = 50, message = "roleCode 는 50자 이내여야 합니다.")
    private String roleCode;

    @Comment("역할명")
    @Column(name = "role_nm", length = 100, nullable = false)
    @Size(max = 100, message = "roleNm 는 100자 이내여야 합니다.")
    private String roleNm;

    @Comment("상위역할ID")
    @Column(name = "parent_role_id", length = 21)
    @Size(max = 21, message = "parentRoleId 는 21자 이내여야 합니다.")
    private String parentRoleId;

    @Comment("역할유형 (코드: ROLE_TYPE_CD — SYSTEM/CUSTOM)")
    @Column(name = "role_type_cd", length = 20)
    @Size(max = 20, message = "roleTypeCd 는 20자 이내여야 합니다.")
    private String roleTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("제한권한여부 Y/N")
    @Column(name = "restrict_perm", length = 1)
    @Size(max = 1, message = "restrictPerm 는 1자 이내여야 합니다.")
    private String restrictPerm;

    @Comment("민감정보(연락처/주소/계좌 등) 원본 열람 권한 Y/N")
    @Column(name = "sensitive_view_yn", length = 1)
    @Size(max = 1, message = "sensitiveViewYn 는 1자 이내여야 합니다.")
    private String sensitiveViewYn;

    @Comment("비고")
    @Column(name = "role_remark", length = 300)
    @Size(max = 300, message = "roleRemark 는 300자 이내여야 합니다.")
    private String roleRemark;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

}
