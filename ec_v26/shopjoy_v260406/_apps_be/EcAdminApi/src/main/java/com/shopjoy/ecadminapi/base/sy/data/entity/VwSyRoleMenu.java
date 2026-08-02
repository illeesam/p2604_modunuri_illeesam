package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.Immutable;

import java.time.LocalDateTime;

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
    private String roleMenuId;


    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Column(name = "menu_id", length = 21, nullable = false)
    private String menuId;

    @Column(name = "perm_level")
    private Integer permLevel;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    // ── sy_role 컬럼 (JOIN 추가분) ──────────────────────────────────────────

    @Column(name = "role_code", length = 50)
    private String roleCode;

    @Column(name = "role_nm", length = 100)
    private String roleNm;

    @Column(name = "role_type_cd", length = 20)
    private String roleTypeCd;

    @Column(name = "role_remark", length = 300)
    private String roleRemark;

    /** sy_role.use_yn */
    @Column(name = "role_use_yn", length = 1)
    private String roleUseYn;

    @Column(name = "parent_role_id", length = 21)
    private String parentRoleId;

    /** sy_role.sort_ord */
    @Column(name = "role_sort_ord")
    private Integer roleSortOrd;
}
