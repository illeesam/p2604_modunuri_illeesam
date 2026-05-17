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
@Table(name = "cm_blog", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시물 엔티티
@Comment("블로그 게시글")
public class CmBlog extends BaseEntity {

    @Id
    @Comment("블로그ID")
    @Column(name = "blog_id", length = 21, nullable = false)
    private String blogId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("블로그카테고리ID (cm_bltn_cate.blog_cate_id)")
    @Column(name = "blog_cate_id", length = 21)
    private String blogCateId;

    @Comment("제목")
    @Column(name = "blog_title", length = 200, nullable = false)
    private String blogTitle;

    @Comment("요약 (미리보기, 검색결과용)")
    @Column(name = "blog_summary", length = 500)
    private String blogSummary;

    @Comment("본문 (HTML 에디터)")
    @Column(name = "blog_content", columnDefinition = "TEXT")
    private String blogContent;

    @Comment("작성자 이름")
    @Column(name = "blog_author", length = 100)
    private String blogAuthor;

    @Comment("상품ID (pd_prod.prod_id, 상품 관련 글일 때만)")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("공개여부 Y/N (비공개 글)")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("공지글 여부 Y/N (상단 고정)")
    @Column(name = "is_notice", length = 1)
    private String isNotice;

}
