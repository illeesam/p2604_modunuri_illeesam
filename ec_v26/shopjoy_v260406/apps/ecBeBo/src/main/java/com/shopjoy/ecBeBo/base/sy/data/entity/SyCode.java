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
@Table(name = "sy_code", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("공통코드")
public class SyCode extends BaseEntity {

    @Id
    @Comment("코드ID (YYMMDDhhmmss+rand4)")
    @Column(name = "code_id", length = 21, nullable = false)
    @Size(max = 21, message = "codeId 는 21자 이내여야 합니다.")
    private String codeId;


    @Comment("코드그룹ID (sy_code_grp.code_grp_id FK)")
    @Column(name = "code_grp_id", length = 50, nullable = false)
    @Size(max = 50, message = "codeGrpId 는 50자 이내여야 합니다.")
    private String codeGrpId;

    @Comment("코드값 (저장값)")
    @Column(name = "code_value", length = 50, nullable = false)
    @Size(max = 50, message = "codeValue 는 50자 이내여야 합니다.")
    private String codeValue;

    @Comment("코드라벨 (표시명)")
    @Column(name = "code_label", length = 100, nullable = false)
    @Size(max = 100, message = "codeLabel 는 100자 이내여야 합니다.")
    private String codeLabel;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)")
    @Column(name = "parent_code_value", length = 50)
    @Size(max = 50, message = "parentCodeValue 는 50자 이내여야 합니다.")
    private String parentCodeValue;

    @Comment("허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)")
    @Column(name = "child_code_values", length = 500)
    @Size(max = 500, message = "childCodeValues 는 500자 이내여야 합니다.")
    private String childCodeValues;

    @Comment("비고")
    @Column(name = "code_remark", length = 300)
    @Size(max = 300, message = "codeRemark 는 300자 이내여야 합니다.")
    private String codeRemark;

    @Comment("코드 트리 레벨 (1=루트, 2=중간, 3=리프 등). parent_code_value와 함께 다단 트리 구성")
    @Column(name = "code_level")
    private Integer codeLevel;

    @Comment("코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)")
    @Column(name = "code_opt1", length = 200)
    @Size(max = 200, message = "codeOpt1 는 200자 이내여야 합니다.")
    private String codeOpt1;

}
