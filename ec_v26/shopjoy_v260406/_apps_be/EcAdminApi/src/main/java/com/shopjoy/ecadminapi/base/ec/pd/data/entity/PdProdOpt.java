package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

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
@Table(name = "pd_prod_opt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 상품 옵션값 엔티티 (실제 옵션 선택지: 빨강, M 등)
@Comment("상품 옵션값 (실제 선택지 — 빨강, M 등)")
public class PdProdOpt extends BaseEntity {

    @Id
    @Comment("옵션ID")
    @Column(name = "prod_opt_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodOptId 는 21자 이내여야 합니다.")
    private String prodOptId;


    @Comment("상품ID (pd_prod.prod_id) — 조회 편의용 비정규화 컬럼")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("옵션명 (예: 빨강, M)")
    @Column(name = "prod_opt_nm", length = 100, nullable = false)
    @Size(max = 100, message = "prodOptNm 는 100자 이내여야 합니다.")
    private String prodOptNm;

    @Comment("실제 저장값 — 직접입력 또는 프리셋 선택 시 자동 채움 (자유 문자열)")
    @Column(name = "prod_opt_val", length = 50)
    @Size(max = 50, message = "prodOptVal 는 50자 이내여야 합니다.")
    private String prodOptVal;

    @Comment("표준 코드값 (코드: PROD_OPT_STD_CD — BLACK/WHITE/SIZE_M 등). 프리셋 선택 시 자동 세팅, 직접입력 시 NULL. 통계·필터 기준 컬럼")
    @Column(name = "prod_opt_std_cd", length = 20)
    @Size(max = 20, message = "prodOptStdCd 는 20자 이내여야 합니다.")
    private String prodOptStdCd;

    @Comment("상위 옵션ID — 2단 옵션에서 상위 1단 옵션값 참조 (pd_prod_opt.prod_opt_id), NULL이면 독립값")
    @Column(name = "parent_prod_opt_id", length = 21)
    @Size(max = 21, message = "parentProdOptId 는 21자 이내여야 합니다.")
    private String parentProdOptId;

    @Comment("옵션 스타일 (컬러 hex 값, 아이콘 클래스 등 자유 문자열)")
    @Column(name = "prod_opt_style", length = 200)
    @Size(max = 100, message = "prodOptStyle 는 100자 이내여야 합니다.")
    private String prodOptStyle;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;


    @Comment("옵션유형레벨 (1 또는 2)")
    @Column(name = "prod_opt_type_level")
    private Integer prodOptTypeLevel;

    @Comment("옵션유형1 분류코드 (예: COLOR)")
    @Column(name = "prod_opt_type1_cd", length = 20)
    @Size(max = 20, message = "prodOptType1Cd 는 20자 이내여야 합니다.")
    private String prodOptType1Cd;

    @Comment("옵션유형2 분류코드 (예: SIZE)")
    @Column(name = "prod_opt_type2_cd", length = 20)
    @Size(max = 20, message = "prodOptType2Cd 는 20자 이내여야 합니다.")
    private String prodOptType2Cd;
}
