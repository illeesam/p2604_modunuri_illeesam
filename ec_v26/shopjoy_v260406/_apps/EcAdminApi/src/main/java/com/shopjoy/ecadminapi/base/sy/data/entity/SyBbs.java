package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_bbs", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시판 게시물 엔티티
public class SyBbs {

    @Id
    @Column(name = "bbs_id", length = 21, nullable = false)
    private String bbsId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "bbm_id", length = 21, nullable = false)
    private String bbmId;

    @Column(name = "parent_bbs_id", length = 21)
    private String parentBbsId;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "author_nm", length = 50)
    private String authorNm;

    @Column(name = "bbs_title", length = 200, nullable = false)
    private String bbsTitle;

    @Lob
    @Column(name = "content_html", columnDefinition = "TEXT")
    private String contentHtml;

    @Column(name = "attach_grp_id", length = 21)
    private String attachGrpId;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "like_count")
    private Integer likeCount;

    @Column(name = "comment_count")
    private Integer commentCount;

    @Column(name = "is_fixed", length = 1)
    private String isFixed;

    @Column(name = "bbs_status_cd", length = 20)
    private String bbsStatusCd;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

}