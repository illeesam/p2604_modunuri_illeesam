package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

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
    private String bbmId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("게시판코드")
    @Column(name = "bbm_code", length = 50, nullable = false)
    private String bbmCode;

    @Comment("게시판명")
    @Column(name = "bbm_nm", length = 100, nullable = false)
    private String bbmNm;

    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("게시판유형 (코드: BBM_TYPE — NORMAL/FAQ/REVIEW/QNA)")
    @Column(name = "bbm_type_cd", length = 20)
    private String bbmTypeCd;

    @Comment("댓글허용 Y/N")
    @Column(name = "allow_comment", length = 1)
    private String allowComment;

    @Comment("첨부허용 Y/N")
    @Column(name = "allow_attach", length = 1)
    private String allowAttach;

    @Comment("좋아요허용 Y/N")
    @Column(name = "allow_like", length = 1)
    private String allowLike;

    @Comment("내용유형 (코드: BBM_CONTENT_TYPE — TEXT/HTML)")
    @Column(name = "content_type_cd", length = 20)
    private String contentTypeCd;

    @Comment("접근범위 (코드: BBM_SCOPE_TYPE — ALL/MEMBER/ADMIN)")
    @Column(name = "scope_type_cd", length = 20)
    private String scopeTypeCd;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "bbm_remark", length = 300)
    private String bbmRemark;

}
