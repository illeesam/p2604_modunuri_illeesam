package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_dept", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 부서 엔티티
public class SyDept {

    @Id
    @Column(name = "dept_id", length = 21, nullable = false)
    private String deptId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "dept_code", length = 50, nullable = false)
    private String deptCode;

    @Column(name = "dept_nm", length = 100, nullable = false)
    private String deptNm;

    @Column(name = "parent_dept_id", length = 21)
    private String parentDeptId;

    @Column(name = "dept_type_cd", length = 20)
    private String deptTypeCd;

    @Column(name = "manager_id", length = 21)
    private String managerId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "dept_remark", length = 300)
    private String deptRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}