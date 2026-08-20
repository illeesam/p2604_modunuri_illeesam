package com.shopjoy.ecadminapi.base.sy.data.entity;

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
@Table(name = "sy_bbm", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 마스터 엔티티
@Comment("게시판 마스터")
public class SyBbm extends BaseEntity {

    @Id
    @Comment("게시판ID (YYMMDDhhmmss+rand4)")
    @Column(name = "bbm_id", length = 21, nullable = false)
    @Size(max = 21, message = "bbmId 는 21자 이내여야 합니다.")
    private String bbmId;


    @Comment("게시판코드")
    @Column(name = "bbm_code", length = 50, nullable = false)
    @Size(max = 50, message = "bbmCode 는 50자 이내여야 합니다.")
    private String bbmCode;

    @Comment("게시판명")
    @Column(name = "bbm_nm", length = 100, nullable = false)
    @Size(max = 100, message = "bbmNm 는 100자 이내여야 합니다.")
    private String bbmNm;

    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("게시판유형 (코드: BBM_TYPE_CD — NORMAL/FAQ/REVIEW/QNA)")
    @Column(name = "bbm_type_cd", length = 20)
    @Size(max = 20, message = "bbmTypeCd 는 20자 이내여야 합니다.")
    private String bbmTypeCd;

    @Comment("댓글허용 Y/N")
    @Column(name = "allow_comment", length = 1)
    @Size(max = 1, message = "allowComment 는 1자 이내여야 합니다.")
    private String allowComment;

    @Comment("첨부허용 Y/N")
    @Column(name = "allow_attach", length = 1)
    @Size(max = 1, message = "allowAttach 는 1자 이내여야 합니다.")
    private String allowAttach;

    @Comment("좋아요허용 Y/N")
    @Column(name = "allow_like", length = 1)
    @Size(max = 1, message = "allowLike 는 1자 이내여야 합니다.")
    private String allowLike;

    @Comment("내용유형 (코드: BBM_CONTENT_TYPE — TEXT/HTML)")
    @Column(name = "content_type_cd", length = 20)
    @Size(max = 20, message = "contentTypeCd 는 20자 이내여야 합니다.")
    private String contentTypeCd;

    @Comment("접근범위 (코드: SCOPE_TYPE_CD — ALL/MEMBER/ADMIN)")
    @Column(name = "scope_type_cd", length = 20)
    @Size(max = 20, message = "scopeTypeCd 는 20자 이내여야 합니다.")
    private String scopeTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "bbm_remark", length = 300)
    @Size(max = 300, message = "bbmRemark 는 300자 이내여야 합니다.")
    private String bbmRemark;

}
