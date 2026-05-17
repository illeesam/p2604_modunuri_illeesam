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
@Table(name = "sy_dept", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 부서 엔티티
@Comment("부서")
public class SyDept extends BaseEntity {

    @Id
    @Comment("부서ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dept_id", length = 21, nullable = false)
    private String deptId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("부서코드")
    @Column(name = "dept_code", length = 50, nullable = false)
    private String deptCode;

    @Comment("부서명")
    @Column(name = "dept_nm", length = 100, nullable = false)
    private String deptNm;

    @Comment("상위부서ID")
    @Column(name = "parent_dept_id", length = 21)
    private String parentDeptId;

    @Comment("부서유형 (코드: DEPT_TYPE)")
    @Column(name = "dept_type_cd", length = 20)
    private String deptTypeCd;

    @Comment("부서장 (sy_user.user_id)")
    @Column(name = "manager_id", length = 21)
    private String managerId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "dept_remark", length = 300)
    private String deptRemark;

}
