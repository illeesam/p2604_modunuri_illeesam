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
@Table(name = "cm_popup", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("공통 선택/조회 팝업 정의")
public class CmPopup extends BaseEntity {

    @Id
    @Comment("팝업ID")
    @Column(name = "popup_id", length = 21, nullable = false)
    private String popupId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("팝업코드 (프론트 호출 키)")
    @Column(name = "popup_code", length = 50, nullable = false)
    private String popupCode;

    @Comment("팝업 제목")
    @Column(name = "popup_nm", length = 100, nullable = false)
    private String popupNm;

    @Comment("화면패턴 1:목록 / 2:트리+목록 / 3:트리+목록+선택목록")
    @Column(name = "popup_pattern")
    private Integer popupPattern;

    @Comment("JPA 엔티티 클래스명")
    @Column(name = "entity_nm", length = 100, nullable = false)
    private String entityNm;

    @Comment("식별자 필드명")
    @Column(name = "id_field", length = 50, nullable = false)
    private String idField;

    @Comment("표시명 필드명")
    @Column(name = "nm_field", length = 50, nullable = false)
    private String nmField;

    @Comment("트리 부모 필드명 (트리 엔티티 기준)")
    @Column(name = "parent_field", length = 50)
    private String parentField;

    @Comment("트리 엔티티명. 비우면 목록 엔티티와 동일")
    @Column(name = "tree_entity_nm", length = 100)
    private String treeEntityNm;

    @Comment("트리 엔티티의 ID 필드")
    @Column(name = "tree_id_field", length = 60)
    private String treeIdField;

    @Comment("트리 엔티티의 표시명 필드")
    @Column(name = "tree_nm_field", length = 60)
    private String treeNmField;

    @Comment("목록 엔티티에서 트리 ID 를 가리키는 필드")
    @Column(name = "tree_link_field", length = 60)
    private String treeLinkField;

    @Comment("사이트 격리 필드명")
    @Column(name = "site_field", length = 50)
    private String siteField;

    @Comment("LEFT JOIN 절. 라벨 조인용. 예: LEFT JOIN SyDept b ON b.deptId = a.deptId (드라이빙 별칭은 항상 a)")
    @Column(name = "join_clause", length = 500)
    private String joinClause;

    @Comment("기본 정렬 (JPQL ORDER BY 내용)")
    @Column(name = "order_by", length = 200)
    private String orderBy;

    @Comment("고정 조건 (JPQL WHERE 조각)")
    @Column(name = "base_where", length = 500)
    private String baseWhere;

    @Comment("다중선택 여부 (Y/N)")
    @Column(name = "multi_yn", length = 1)
    private String multiYn;

    @Comment("사용 시스템 범위 ^BO^ / ^FO^ 멀티값")
    @Column(name = "sys_scope", length = 20)
    private String sysScope;

    @Comment("페이징 사용 여부 Y/N. N 이면 페이저 없이 전체 표시")
    @Column(name = "paging_yn", length = 1)
    private String pagingYn;

    @Comment("페이지 크기(paging_yn=Y). N 이면 최대 표시 건수")
    @Column(name = "page_size")
    private Integer pageSize;

    @Comment("모달 폭")
    @Column(name = "modal_width", length = 20)
    private String modalWidth;

    @Comment("사용여부 (Y/N)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("이 팝업을 사용하는 화면 파일명 나열 (영향 범위 확인용)")
    @Column(name = "apply_ui_memo", length = 500)
    private String applyUiMemo;

    @Comment("비고")
    @Column(name = "remark", length = 500)
    private String remark;
}
