package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_popup_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("공통 팝업 항목(필드) 속성")
public class CmPopupItem extends BaseEntity {

    @Id
    @Comment("팝업항목ID")
    @Column(name = "popup_item_id", length = 21, nullable = false)
    private String popupItemId;


    @Comment("팝업ID (cm_popup.popup_id FK)")
    @Column(name = "popup_id", length = 21, nullable = false)
    private String popupId;

    @Comment("엔티티 필드명")
    @Column(name = "field_nm", length = 50, nullable = false)
    private String fieldNm;

    @Comment("화면 표시 라벨")
    @Column(name = "field_label", length = 100, nullable = false)
    private String fieldLabel;

    @Comment("필드유형 TEXT/NUMBER/DATE/CODE/BADGE")
    @Column(name = "field_type_cd", length = 20)
    private String fieldTypeCd;

    @Comment("공통코드 그룹 (field_type_cd=CODE)")
    @Column(name = "code_grp", length = 50)
    private String codeGrp;

    @Comment("조회조건 항목 여부 (Y/N)")
    @Column(name = "search_yn", length = 1)
    private String searchYn;

    @Comment("검색연산 LIKE/EQ/RANGE")
    @Column(name = "search_type_cd", length = 20)
    private String searchTypeCd;

    @Comment("목록 컬럼 여부 (Y/N)")
    @Column(name = "list_yn", length = 1)
    private String listYn;

    @Comment("트리 노드 라벨 사용 여부 (Y/N)")
    @Column(name = "tree_label_yn", length = 1)
    private String treeLabelYn;

    @Comment("목록 컬럼 폭")
    @Column(name = "col_width", length = 20)
    private String colWidth;

    @Comment("정렬 left/center/right")
    @Column(name = "col_align", length = 10)
    private String colAlign;

    @Comment("선택 트리거 컬럼 여부 (Y/N)")
    @Column(name = "link_yn", length = 1)
    private String linkYn;

    @Comment("출력식. 비우면 드라이빙(a) 엔티티 필드. 조인 컬럼은 <별칭>.<필드> (예: b.deptNm)")
    @Column(name = "select_expr", length = 100)
    private String selectExpr;

    @Comment("로그인 정보에서 자동 주입할 속성명 (memberId/userId/vendorId/deptId 등). 비우면 일반 검색항목")
    @Column(name = "session_cond_field", length = 30)
    private String sessionCondField;

    @Comment("필수 조회조건 여부 (Y/N). session_cond_field 지정 시 반드시 Y")
    @Column(name = "required_yn", length = 1)
    private String requiredYn;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    private String remark;
}
