package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_role_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 역할별 메뉴 권한 엔티티
public class SyRoleMenu {

    @Id
    @Column(name = "role_menu_id", length = 21, nullable = false)
    private String roleMenuId;

    @Column(name = "site_id", length = 21)
    private String siteId;

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

}