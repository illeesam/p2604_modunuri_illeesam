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
@Table(name = "sy_code", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("공통코드")
public class SyCode extends BaseEntity {

    @Id
    @Comment("코드ID (YYMMDDhhmmss+rand4)")
    @Column(name = "code_id", length = 21, nullable = false)
    private String codeId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("코드그룹 (sy_code_grp.code_grp)")
    @Column(name = "code_grp", length = 50, nullable = false)
    private String codeGrp;

    @Comment("코드값 (저장값)")
    @Column(name = "code_value", length = 50, nullable = false)
    private String codeValue;

    @Comment("코드라벨 (표시명)")
    @Column(name = "code_label", length = 100, nullable = false)
    private String codeLabel;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("부모 코드값 (트리 구조 시 상위 code_value, null이면 루트)")
    @Column(name = "parent_code_value", length = 50)
    private String parentCodeValue;

    @Comment("허용 자식/전이 코드값 목록 (^VAL1^VAL2^ 형식 — 상태 전이 제약이나 하위 코드 목록)")
    @Column(name = "child_code_values", length = 500)
    private String childCodeValues;

    @Comment("비고")
    @Column(name = "code_remark", length = 300)
    private String codeRemark;

    @Comment("코드 트리 레벨 (1=루트, 2=중간, 3=리프 등). parent_code_value와 함께 다단 트리 구성")
    @Column(name = "code_level")
    private Integer codeLevel;

    @Comment("코드별 부가 옵션 1 (스타일 색상 hex, 아이콘 클래스 등 자유 문자열)")
    @Column(name = "code_opt1", length = 200)
    private String codeOpt1;

}
