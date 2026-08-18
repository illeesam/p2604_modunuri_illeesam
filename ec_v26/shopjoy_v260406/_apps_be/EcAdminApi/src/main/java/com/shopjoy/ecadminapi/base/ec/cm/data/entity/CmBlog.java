package com.shopjoy.ecadminapi.base.ec.cm.data.entity;

import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import com.shopjoy.ecadminapi.base.sy.data.dto.AttachFile;
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
    @Size(max = 21, message = "blogId 는 21자 이내여야 합니다.")
    private String blogId;

    @Comment("블로그카테고리ID (cm_bltn_cate.blog_cate_id)")
    @Column(name = "blog_cate_id", length = 21)
    @Size(max = 21, message = "blogCateId 는 21자 이내여야 합니다.")
    private String blogCateId;

    @Comment("게시글 구분 코드 (NEWS=뉴스 / BLOG=블로그)")
    @Column(name = "blog_type_cd", length = 20)
    @Size(max = 20, message = "blogTypeCd 는 20자 이내여야 합니다.")
    private String blogTypeCd;

    @Comment("제목")
    @Column(name = "blog_title", length = 200, nullable = false)
    @NotBlank(message = "블로그 제목을 입력해주세요.")
    @Size(max = 100, message = "블로그 제목은 100자 이내로 입력해주세요.")
    private String blogTitle;

    @Comment("요약 (미리보기, 검색결과용)")
    @Column(name = "blog_summary", length = 500)
    @Size(max = 100, message = "blogSummary 는 100자 이내여야 합니다.")
    private String blogSummary;

    @Comment("본문 (HTML 에디터)")
    @Column(name = "blog_content", columnDefinition = "TEXT")
    @Size(max = 50000, message = "blogContent 는 50000자 이내여야 합니다.")
    private String blogContent;

    @Comment("작성자 이름")
    @Column(name = "blog_author", length = 100)
    @Size(max = 100, message = "blogAuthor 는 100자 이내여야 합니다.")
    private String blogAuthor;

    @Comment("상품ID (pd_prod.prod_id, 상품 관련 글일 때만)")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("공개여부 Y/N (비공개 글)")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("공지글 여부 Y/N (상단 고정)")
    @Column(name = "is_notice", length = 1)
    @Size(max = 1, message = "isNotice 는 1자 이내여야 합니다.")
    private String isNotice;

    /** 첨부파일 목록 — DB 컬럼 아님({@literal @}Transient). 요청 시엔 attachId/rowStatus(I/D) 만 채워 보내고,
     *  create()/update() 가 blogId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한 뒤,
     *  같은 필드를 SyAttachService.getAttachFilesByRef() 결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

}
