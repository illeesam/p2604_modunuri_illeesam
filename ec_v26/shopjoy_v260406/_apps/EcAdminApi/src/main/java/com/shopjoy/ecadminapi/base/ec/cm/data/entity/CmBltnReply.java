package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "cm_bltn_reply", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시물 댓글 엔티티
public class CmBltnReply {

    @Id
    @Column(name = "comment_id", length = 21, nullable = false)
    private String commentId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Column(name = "parent_comment_id", length = 21)
    private String parentCommentId;

    @Column(name = "writer_id", length = 21)
    private String writerId;

    @Column(name = "writer_nm", length = 50)
    private String writerNm;

    @Lob
    @Column(name = "blog_comment_content", columnDefinition = "TEXT")
    private String blogCommentContent;

    @Column(name = "comment_status_cd", length = 20)
    private String commentStatusCd;

    @Column(name = "comment_status_cd_before", length = 20)
    private String commentStatusCdBefore;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}