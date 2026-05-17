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
@Table(name = "sy_bbs", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 게시물 엔티티
@Comment("게시물")
public class SyBbs extends BaseEntity {

    @Id
    @Comment("게시물ID (YYMMDDhhmmss+rand4)")
    @Column(name = "bbs_id", length = 21, nullable = false)
    private String bbsId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("게시판ID")
    @Column(name = "bbm_id", length = 21, nullable = false)
    private String bbmId;

    @Comment("부모게시물ID (답글)")
    @Column(name = "parent_bbs_id", length = 21)
    private String parentBbsId;

    @Comment("작성자 회원ID")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("작성자명")
    @Column(name = "author_nm", length = 50)
    private String authorNm;

    @Comment("제목")
    @Column(name = "bbs_title", length = 200, nullable = false)
    private String bbsTitle;

    @Comment("내용 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Comment("첨부파일그룹ID")
    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("좋아요수")
    @Column(name = "like_count")
    private Integer likeCount;

    @Comment("댓글수")
    @Column(name = "comment_count")
    private Integer commentCount;

    @Comment("상단고정 Y/N")
    @Column(name = "is_fixed", length = 1)
    private String isFixed;

    @Comment("상태 (ACTIVE/DELETED/HIDDEN)")
    @Column(name = "bbs_status_cd", length = 20)
    private String bbsStatusCd;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
