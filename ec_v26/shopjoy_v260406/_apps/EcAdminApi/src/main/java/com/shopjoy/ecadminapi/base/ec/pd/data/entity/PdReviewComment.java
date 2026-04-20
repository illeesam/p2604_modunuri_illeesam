package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pd_review_comment", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 리뷰 댓글 엔티티
public class PdReviewComment {

    @Id
    @Column(name = "review_comment_id", length = 21, nullable = false)
    private String reviewCommentId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Column(name = "parent_reply_id", length = 21)
    private String parentReplyId;

    @Column(name = "writer_type_cd", length = 20)
    private String writerTypeCd;

    @Column(name = "writer_id", length = 21)
    private String writerId;

    @Column(name = "writer_nm", length = 50)
    private String writerNm;

    @Lob
    @Column(name = "review_reply_content", columnDefinition = "TEXT")
    private String reviewReplyContent;

    @Column(name = "reply_status_cd", length = 20)
    private String replyStatusCd;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}