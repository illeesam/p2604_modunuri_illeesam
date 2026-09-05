package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "menuId 는 21자 이내여야 합니다.")
    private String menuId;


    @Comment("메뉴코드")
    @Column(name = "menu_code", length = 50, nullable = false)
    @Size(max = 50, message = "menuCode 는 50자 이내여야 합니다.")
    private String menuCode;

    @Comment("메뉴명")
    @Column(name = "menu_nm", length = 100, nullable = false)
    @Size(max = 100, message = "menuNm 는 100자 이내여야 합니다.")
    private String menuNm;

    @Comment("상위메뉴ID")
    @Column(name = "parent_menu_id", length = 21)
    @Size(max = 21, message = "parentMenuId 는 21자 이내여야 합니다.")
    private String parentMenuId;

    @Comment("메뉴URL")
    @Column(name = "menu_url", length = 200)
    @Size(max = 200, message = "menuUrl 는 200자 이내여야 합니다.")
    private String menuUrl;

    @Comment("메뉴유형 (코드: MENU_TYPE_CD — PAGE/FOLDER/LINK)")
    @Column(name = "menu_type_cd", length = 20)
    @Size(max = 20, message = "menuTypeCd 는 20자 이내여야 합니다.")
    private String menuTypeCd;

    @Comment("아이콘 CSS 클래스")
    @Column(name = "icon_class", length = 100)
    @Size(max = 100, message = "iconClass 는 100자 이내여야 합니다.")
    private String iconClass;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "menu_remark", length = 300)
    @Size(max = 300, message = "menuRemark 는 300자 이내여야 합니다.")
    private String menuRemark;

}
