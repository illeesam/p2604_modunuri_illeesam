package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_role_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 역할별 메뉴 권한 엔티티
@Comment("역할-메뉴 권한 매핑")
public class SyRoleMenu extends BaseEntity {

    @Id
    @Comment("역할메뉴ID")
    @Column(name = "role_menu_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleMenuId 는 21자 이내여야 합니다.")
    private String roleMenuId;


    @Comment("역할ID")
    @Column(name = "role_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;

    @Comment("메뉴ID")
    @Column(name = "menu_id", length = 21, nullable = false)
    @Size(max = 21, message = "menuId 는 21자 이내여야 합니다.")
    private String menuId;

    @Comment("권한레벨 (1:조회/2:수정/3:삭제)")
    @Column(name = "perm_level")
    private Integer permLevel;

}
