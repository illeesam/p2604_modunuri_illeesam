package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

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
@Table(name = "pd_review_comment", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 리뷰 댓글 엔티티
@Comment("리뷰 댓글")
public class PdReviewComment extends BaseEntity {

    @Id
    @Comment("댓글ID")
    @Column(name = "review_comment_id", length = 21, nullable = false)
    @Size(max = 21, message = "reviewCommentId 는 21자 이내여야 합니다.")
    private String reviewCommentId;


    @Comment("리뷰ID (pd_review.)")
    @Column(name = "review_id", length = 21, nullable = false)
    @Size(max = 21, message = "reviewId 는 21자 이내여야 합니다.")
    private String reviewId;

    @Comment("상위댓글ID (대댓글)")
    @Column(name = "parent_reply_id", length = 21)
    @Size(max = 21, message = "parentReplyId 는 21자 이내여야 합니다.")
    private String parentReplyId;

    @Comment("작성자유형 (코드: WRITER_TYPE_CD — MEMBER/SELLER/ADMIN)")
    @Column(name = "writer_type_cd", length = 20)
    @Size(max = 20, message = "writerTypeCd 는 20자 이내여야 합니다.")
    private String writerTypeCd;

    @Comment("작성자ID")
    @Column(name = "writer_id", length = 21)
    @Size(max = 21, message = "writerId 는 21자 이내여야 합니다.")
    private String writerId;

    @Comment("작성자명")
    @Column(name = "writer_nm", length = 50)
    @Size(max = 50, message = "writerNm 는 50자 이내여야 합니다.")
    private String writerNm;

    @Comment("댓글 내용")
    @Column(name = "review_reply_content", columnDefinition = "TEXT")
    @Size(max = 50000, message = "reviewReplyContent 는 50000자 이내여야 합니다.")
    private String reviewReplyContent;

    @Comment("상태 (ACTIVE/HIDDEN/DELETED)")
    @Column(name = "reply_status_cd", length = 20)
    @Size(max = 20, message = "replyStatusCd 는 20자 이내여야 합니다.")
    private String replyStatusCd;

}
