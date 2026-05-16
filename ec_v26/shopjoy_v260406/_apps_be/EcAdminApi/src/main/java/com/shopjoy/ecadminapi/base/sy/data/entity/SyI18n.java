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
@Table(name = "sy_i18n", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 다국어 엔티티
@Comment("다국어 키 마스터")
public class SyI18n extends BaseEntity {

    @Id
    @Comment("다국어ID (YYMMDDhhmmss+rand4)")
    @Column(name = "i18n_id", length = 21, nullable = false)
    private String i18nId;

    @Comment("사이트ID (sy_site.site_id, NULL=전체 공용)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("다국어 키 (예: common.bt.save, error.FORBIDDEN)")
    @Column(name = "i18n_key", length = 200, nullable = false)
    private String i18nKey;

    @Comment("키 설명 (번역자 참고용)")
    @Column(name = "i18n_desc", length = 200)
    private String i18nDesc;

    @Comment("적용범위 (코드: I18N_SCOPE — FO/BO/COMMON)")
    @Column(name = "i18n_scope_cd", length = 20)
    private String i18nScopeCd;

    @Comment("키 첫 세그먼트 (common/error/link/paging 등)")
    @Column(name = "i18n_category", length = 50)
    private String i18nCategory;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
