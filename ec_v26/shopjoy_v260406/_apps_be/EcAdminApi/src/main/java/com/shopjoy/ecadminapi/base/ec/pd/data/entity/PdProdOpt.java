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
@Table(name = "pd_prod_opt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션값 엔티티 (실제 옵션 선택지: 빨강, M 등)
@Comment("상품 옵션값 (실제 선택지 — 빨강, M 등)")
public class PdProdOpt extends BaseEntity {

    @Id
    @Comment("옵션ID")
    @Column(name = "prod_opt_id", length = 21, nullable = false)
    private String prodOptId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("옵션유형ID (pd_prod_opt_type.prod_opt_type_id)")
    @Column(name = "prod_opt_type_id", length = 21, nullable = false)
    private String prodOptTypeId;

    @Comment("상품ID (pd_prod.prod_id) — 조회 편의용 비정규화 컬럼")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("옵션명 (예: 빨강, M)")
    @Column(name = "prod_opt_nm", length = 100, nullable = false)
    private String prodOptNm;

    @Comment("실제 저장값 — 직접입력 또는 prod_opt_type_level2_cd 유형의 코드값 자동 채움")
    @Column(name = "prod_opt_val", length = 50)
    private String prodOptVal;

    @Comment("1단 분류 코드 — pd_prod.prod_opt_type_level1_cd 비정규화 (COLOR/SIZE 등)")
    @Column(name = "prod_opt_type_level1_cd", length = 20)
    private String prodOptTypeLevel1Cd;

    @Comment("2단 분류 코드 — pd_prod_opt_type.prod_opt_type_level2_cd 비정규화 (NULL 가능)")
    @Column(name = "prod_opt_type_level2_cd", length = 20)
    private String prodOptTypeLevel2Cd;

    @Comment("상위 옵션ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt.prod_opt_id), NULL이면 독립값")
    @Column(name = "parent_prod_opt_id", length = 21)
    private String parentProdOptId;

    @Comment("옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열)")
    @Column(name = "prod_opt_style", length = 200)
    private String prodOptStyle;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
