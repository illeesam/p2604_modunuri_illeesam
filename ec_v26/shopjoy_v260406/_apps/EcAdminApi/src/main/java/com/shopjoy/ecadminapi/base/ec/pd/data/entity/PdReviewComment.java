package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "pd_review_comment", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 리뷰 댓글 엔티티
public class PdReviewComment extends BaseEntity {

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

    @Column(name = "review_reply_content", columnDefinition = "TEXT")
    private String reviewReplyContent;

    @Column(name = "reply_status_cd", length = 20)
    private String replyStatusCd;

}
