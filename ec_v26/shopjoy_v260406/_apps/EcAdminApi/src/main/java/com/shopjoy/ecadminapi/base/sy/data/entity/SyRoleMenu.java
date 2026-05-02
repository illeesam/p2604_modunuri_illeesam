package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_role_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 역할별 메뉴 권한 엔티티
public class SyRoleMenu extends BaseEntity {

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

}
