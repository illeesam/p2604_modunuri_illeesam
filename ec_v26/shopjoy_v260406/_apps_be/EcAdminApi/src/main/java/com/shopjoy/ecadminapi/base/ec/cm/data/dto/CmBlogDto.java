package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmBlogDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 1) private String useYn;  // 공개여부 Y/N 필터
        @Size(max = 1) private String isNotice;  // 공지글 여부 Y/N 필터
        @Size(max = 21) private String blogId;  // 블로그ID 필터
        @Size(max = 20) private String blogTypeCd;  // 게시글 구분 코드 필터 — BLOG_TYPE {NEWS:뉴스, BLOG:블로그}
        @Size(max = 21) private String blogCateId;  // 블로그카테고리ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogId;  // 블로그ID
        private String blogCateId;  // 블로그카테고리ID (cm_blog_cate.blog_cate_id)
        private String blogTypeCd;  // 게시글 구분 코드 — BLOG_TYPE {NEWS:뉴스, BLOG:블로그}
        private String blogTitle;  // 제목
        private String blogSummary;  // 요약 (미리보기, 검색결과용)
        private String blogContent;  // 본문 (HTML 에디터)
        private String blogAuthor;  // 작성자 이름
        private String prodId;  // 상품ID (pd_prod.prod_id, 상품 관련 글일 때만)
        private Integer viewCount;  // 조회수
        private String useYn;  // 공개여부 Y/N (비공개 글)
        private String isNotice;  // 공지글 여부 Y/N (상단 고정)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<CmBlogReplyDto.Item> replies;   // 댓글 목록
        private List<CmBlogFileDto.Item>  files;     // 첨부 목록
        private List<CmBlogTagDto.Item>   tags;      // 태그 목록
    }

}
