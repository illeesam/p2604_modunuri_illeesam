package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "cm_blog_reply", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 댓글 엔티티
@Comment("블로그 댓글")
public class CmBlogReply extends BaseEntity {

    @Id
    @Comment("댓글ID")
    @Column(name = "comment_id", length = 21, nullable = false)
    private String commentId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("블로그ID")
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Comment("대댓글 부모ID")
    @Column(name = "parent_comment_id", length = 21)
    private String parentCommentId;

    @Comment("작성자ID")
    @Column(name = "writer_id", length = 21)
    private String writerId;

    @Comment("작성자명")
    @Column(name = "writer_nm", length = 50)
    private String writerNm;

    @Comment("댓글 내용")
    @Column(name = "blog_comment_content", columnDefinition = "TEXT")
    private String blogCommentContent;

    @Comment("상태 (코드: COMMENT_STATUS)")
    @Column(name = "comment_status_cd", length = 20)
    private String commentStatusCd;

    @Comment("변경 전 댓글상태 (코드: COMMENT_STATUS)")
    @Column(name = "comment_status_cd_before", length = 20)
    private String commentStatusCdBefore;

}
