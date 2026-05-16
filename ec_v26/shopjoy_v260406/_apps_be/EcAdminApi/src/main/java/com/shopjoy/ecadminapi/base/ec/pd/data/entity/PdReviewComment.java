package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "pd_review_comment", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 리뷰 댓글 엔티티
@Comment("리뷰 댓글")
public class PdReviewComment extends BaseEntity {

    @Id
    @Comment("댓글ID")
    @Column(name = "review_comment_id", length = 21, nullable = false)
    private String reviewCommentId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("리뷰ID (pd_review.)")
    @Column(name = "review_id", length = 21, nullable = false)
    private String reviewId;

    @Comment("상위댓글ID (대댓글)")
    @Column(name = "parent_reply_id", length = 21)
    private String parentReplyId;

    @Comment("작성자유형 (코드: REVIEW_WRITER_TYPE — MEMBER/SELLER/ADMIN)")
    @Column(name = "writer_type_cd", length = 20)
    private String writerTypeCd;

    @Comment("작성자ID")
    @Column(name = "writer_id", length = 21)
    private String writerId;

    @Comment("작성자명")
    @Column(name = "writer_nm", length = 50)
    private String writerNm;

    @Comment("댓글 내용")
    @Column(name = "review_reply_content", columnDefinition = "TEXT")
    private String reviewReplyContent;

    @Comment("상태 (ACTIVE/HIDDEN/DELETED)")
    @Column(name = "reply_status_cd", length = 20)
    private String replyStatusCd;

}
