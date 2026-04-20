package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 메뉴 엔티티
public class SyMenu {

    @Id
    @Column(name = "menu_id", length = 21, nullable = false)
    private String menuId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "menu_code", length = 50, nullable = false)
    private String menuCode;

    @Column(name = "menu_nm", length = 100, nullable = false)
    private String menuNm;

    @Column(name = "parent_menu_id", length = 21)
    private String parentMenuId;

    @Column(name = "menu_url", length = 200)
    private String menuUrl;

    @Column(name = "menu_type_cd", length = 20)
    private String menuTypeCd;

    @Column(name = "icon_class", length = 100)
    private String iconClass;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "menu_remark", length = 300)
    private String menuRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}