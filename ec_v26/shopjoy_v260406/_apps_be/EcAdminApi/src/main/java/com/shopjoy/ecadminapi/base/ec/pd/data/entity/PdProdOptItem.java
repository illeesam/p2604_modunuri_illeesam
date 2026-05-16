package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_prod_opt_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션 아이템 엔티티
@Comment("상품 옵션 값")
public class PdProdOptItem extends BaseEntity {

    @Id
    @Comment("옵션값ID")
    @Column(name = "opt_item_id", length = 21, nullable = false)
    private String optItemId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("옵션ID (pd_prod_opt.opt_id)")
    @Column(name = "opt_id", length = 21, nullable = false)
    private String optId;

    @Comment("옵션카테고리 (코드: OPT_TYPE — COLOR/SIZE/MATERIAL/CUSTOM)")
    @Column(name = "opt_type_cd", length = 20, nullable = false)
    private String optTypeCd;

    @Comment("옵션값 표시명 (예: 빨강, M)")
    @Column(name = "opt_nm", length = 100, nullable = false)
    private String optNm;

    @Comment("실제 저장값 — opt_val_code_id 선택 시 codeValue 자동 채움, 직접입력도 허용")
    @Column(name = "opt_val", length = 50)
    private String optVal;

    @Comment("OPT_VAL 공통코드 참조ID (sy_code.code_id) — NULL이면 opt_val 직접입력")
    @Column(name = "opt_val_code_id", length = 50)
    private String optValCodeId;

    @Comment("상위 옵션값ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt_item.opt_item_id), NULL이면 독립값(전체 공통)")
    @Column(name = "parent_opt_item_id", length = 21)
    private String parentOptItemId;

    @Comment("옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열). 비어 있으면 표시명 텍스트만 사용")
    @Column(name = "opt_style", length = 200)
    private String optStyle;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
