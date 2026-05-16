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
@Table(name = "cm_blog_good", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 좋아요 엔티티
@Comment("블로그 좋아요")
public class CmBlogGood extends BaseEntity {

    @Id
    @Comment("좋아요ID")
    @Column(name = "like_id", length = 21, nullable = false)
    private String likeId;

    @Comment("블로그ID (cm_bltn.)")
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Comment("사용자ID (sy_member.user_id)")
    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

}
