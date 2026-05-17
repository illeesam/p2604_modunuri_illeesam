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
@Table(name = "sy_menu", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 메뉴 엔티티
@Comment("메뉴")
public class SyMenu extends BaseEntity {

    @Id
    @Comment("메뉴ID (YYMMDDhhmmss+rand4)")
    @Column(name = "menu_id", length = 21, nullable = false)
    private String menuId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("메뉴코드")
    @Column(name = "menu_code", length = 50, nullable = false)
    private String menuCode;

    @Comment("메뉴명")
    @Column(name = "menu_nm", length = 100, nullable = false)
    private String menuNm;

    @Comment("상위메뉴ID")
    @Column(name = "parent_menu_id", length = 21)
    private String parentMenuId;

    @Comment("메뉴URL")
    @Column(name = "menu_url", length = 200)
    private String menuUrl;

    @Comment("메뉴유형 (코드: MENU_TYPE — PAGE/FOLDER/LINK)")
    @Column(name = "menu_type_cd", length = 20)
    private String menuTypeCd;

    @Comment("아이콘 CSS 클래스")
    @Column(name = "icon_class", length = 100)
    private String iconClass;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "menu_remark", length = 300)
    private String menuRemark;

}
