package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "cm_blog_good", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 게시물 좋아요 엔티티
public class CmBlogGood {

    @Id
    @Column(name = "like_id", length = 21, nullable = false)
    private String likeId;

    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}
