package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

import jakarta.validation.constraints.Size;
/**
 * vw_sy_role_menu 뷰 엔티티 (READ-ONLY)
 * sy_role_menu + sy_role INNER JOIN 뷰
 * — 역할-메뉴 권한 조회 시 역할명(role_nm), 역할코드(role_code) 등을 별도 JOIN 없이 바로 조회
 */
@Entity
@Immutable
@Table(name = "vw_sy_role_menu", schema = "shopjoy_2604")
@Getter
@NoArgsConstructor
public class VwSyRoleMenu {

    // ── sy_role_menu 컬럼 ───────────────────────────────────────────────────

    @Id
    @Column(name = "role_menu_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleMenuId 는 21자 이내여야 합니다.")
    private String roleMenuId;


    @Column(name = "role_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;

    @Column(name = "menu_id", length = 21, nullable = false)
    @Size(max = 21, message = "menuId 는 21자 이내여야 합니다.")
    private String menuId;

    @Column(name = "perm_level")
    private Integer permLevel;

    @Column(name = "reg_by", length = 30)
    @Size(max = 30, message = "regBy 는 30자 이내여야 합니다.")
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    @Size(max = 30, message = "updBy 는 30자 이내여야 합니다.")
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── sy_role 컬럼 (JOIN 추가분) ──────────────────────────────────────────

    @Column(name = "role_code", length = 50)
    @Size(max = 50, message = "roleCode 는 50자 이내여야 합니다.")
    private String roleCode;

    @Column(name = "role_nm", length = 100)
    @Size(max = 100, message = "roleNm 는 100자 이내여야 합니다.")
    private String roleNm;

    @Column(name = "role_type_cd", length = 20)
    @Size(max = 20, message = "roleTypeCd 는 20자 이내여야 합니다.")
    private String roleTypeCd;

    @Column(name = "role_remark", length = 300)
    @Size(max = 300, message = "roleRemark 는 300자 이내여야 합니다.")
    private String roleRemark;

    /** sy_role.use_yn */
    @Column(name = "role_use_yn", length = 1)
    @Size(max = 1, message = "roleUseYn 는 1자 이내여야 합니다.")
    private String roleUseYn;

    @Column(name = "parent_role_id", length = 21)
    @Size(max = 21, message = "parentRoleId 는 21자 이내여야 합니다.")
    private String parentRoleId;

    /** sy_role.sort_ord */
    @Column(name = "role_sort_ord")
    private Integer roleSortOrd;
}
