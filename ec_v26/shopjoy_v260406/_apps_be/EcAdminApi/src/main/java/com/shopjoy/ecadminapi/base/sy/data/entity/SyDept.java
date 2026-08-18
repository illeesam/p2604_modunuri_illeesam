package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_dept", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 부서 엔티티
@Comment("부서")
public class SyDept extends BaseEntity {

    @Id
    @Comment("부서ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dept_id", length = 21, nullable = false)
    @Size(max = 21, message = "deptId 는 21자 이내여야 합니다.")
    private String deptId;


    @Comment("부서코드")
    @Column(name = "dept_code", length = 50, nullable = false)
    @Size(max = 50, message = "deptCode 는 50자 이내여야 합니다.")
    private String deptCode;

    @Comment("부서명")
    @Column(name = "dept_nm", length = 100, nullable = false)
    @Size(max = 100, message = "deptNm 는 100자 이내여야 합니다.")
    private String deptNm;

    @Comment("상위부서ID")
    @Column(name = "parent_dept_id", length = 21)
    @Size(max = 21, message = "parentDeptId 는 21자 이내여야 합니다.")
    private String parentDeptId;

    @Comment("부서유형 (코드: DEPT_TYPE_CD)")
    @Column(name = "dept_type_cd", length = 20)
    @Size(max = 20, message = "deptTypeCd 는 20자 이내여야 합니다.")
    private String deptTypeCd;

    @Comment("부서장 (sy_user.user_id)")
    @Column(name = "manager_id", length = 21)
    @Size(max = 21, message = "managerId 는 21자 이내여야 합니다.")
    private String managerId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "dept_remark", length = 300)
    @Size(max = 100, message = "deptRemark 는 100자 이내여야 합니다.")
    private String deptRemark;

}
