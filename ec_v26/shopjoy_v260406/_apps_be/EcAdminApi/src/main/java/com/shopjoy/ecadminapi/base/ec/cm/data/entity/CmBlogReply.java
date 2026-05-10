package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "cm_blog_reply", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 댓글 엔티티
public class CmBlogReply extends BaseEntity {

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

    @Column(name = "blog_comment_content", columnDefinition = "TEXT")
    private String blogCommentContent;

    @Column(name = "comment_status_cd", length = 20)
    private String commentStatusCd;

    @Column(name = "comment_status_cd_before", length = 20)
    private String commentStatusCdBefore;

}
