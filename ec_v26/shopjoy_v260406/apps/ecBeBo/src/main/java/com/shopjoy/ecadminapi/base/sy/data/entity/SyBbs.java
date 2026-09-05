package com.shopjoy.ecadminapi.base.sy.data.entity;

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
@Table(name = "sy_bbs", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 게시판 게시물 엔티티
@Comment("게시물")
public class SyBbs extends BaseEntity {

    @Id
    @Comment("게시물ID (YYMMDDhhmmss+rand4)")
    @Column(name = "bbs_id", length = 21, nullable = false)
    @Size(max = 21, message = "bbsId 는 21자 이내여야 합니다.")
    private String bbsId;

    @Comment("게시판ID")
    @Column(name = "bbm_id", length = 21, nullable = false)
    @Size(max = 21, message = "bbmId 는 21자 이내여야 합니다.")
    private String bbmId;

    @Comment("부모게시물ID (답글)")
    @Column(name = "parent_bbs_id", length = 21)
    @Size(max = 21, message = "parentBbsId 는 21자 이내여야 합니다.")
    private String parentBbsId;

    @Comment("작성자 회원ID")
    @Column(name = "member_id", length = 21)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("작성자명")
    @Column(name = "author_nm", length = 50)
    @Size(max = 50, message = "authorNm 는 50자 이내여야 합니다.")
    private String authorNm;

    @Comment("제목")
    @Column(name = "bbs_title", length = 200, nullable = false)
    @NotBlank(message = "게시글 제목을 입력해주세요.")
    @Size(max = 200, message = "게시글 제목은 200자 이내로 입력해주세요.")
    private String bbsTitle;

    @Comment("내용 (HTML)")
    @Column(name = "content_html", columnDefinition = "TEXT")
    @Size(max = 500000, message = "contentHtml 는 500,000자 이내여야 합니다.")
    private String contentHtml;

    @Comment("조회수")
    @Column(name = "view_count")
    private Integer viewCount;

    @Comment("좋아요수")
    @Column(name = "like_count")
    private Integer likeCount;

    @Comment("댓글수")
    @Column(name = "comment_count")
    private Integer commentCount;

    @Comment("상단고정 Y/N")
    @Column(name = "is_fixed", length = 1)
    @Size(max = 1, message = "isFixed 는 1자 이내여야 합니다.")
    private String isFixed;

    @Comment("상태 (ACTIVE/DELETED/HIDDEN)")
    @Column(name = "bbs_status_cd", length = 20)
    @Size(max = 20, message = "bbsStatusCd 는 20자 이내여야 합니다.")
    private String bbsStatusCd;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    /** DB 컬럼 아님 — 첨부파일 목록. 요청 시엔 attachId/rowStatus(I/D) 만 채워 보내고,
     *  create()/update() 가 bbsId 확정 직후 같은 트랜잭션에서 sy_attach 에 반영한 뒤,
     *  같은 필드를 SyAttachService.getAttachFilesByRef() 결과로 덮어써 응답에 되돌려준다. */
    @Transient
    private List<AttachFile> attachFiles;

}
