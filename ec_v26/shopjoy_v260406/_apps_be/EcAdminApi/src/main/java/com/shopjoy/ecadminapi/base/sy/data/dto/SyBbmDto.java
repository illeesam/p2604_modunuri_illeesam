package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBbmDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String bbmId;  // 게시판ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 20) private String typeCd;  // 게시판유형 필터 — BBM_TYPE_CD {NORMAL:일반팝업, NOTICE:공지팝업, EVENT:이벤트팝업, COOKIE:쿠키팝업, BOARD:게시판, FAQ:FAQ, REVIEW:리뷰}
        @Size(max = 1) private String useYn;  // 사용여부 필터 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_bbm ──────────────────────────────────────────
        private String bbmId;  // 게시판ID (YYMMDDhhmmss+rand4)
        private String bbmCode;  // 게시판코드
        private String bbmNm;  // 게시판명
        private String pathId;  // 표시경로ID
        private String bbmTypeCd;  // 게시판유형 — BBM_TYPE_CD {NORMAL:일반팝업, NOTICE:공지팝업, EVENT:이벤트팝업, COOKIE:쿠키팝업, BOARD:게시판, FAQ:FAQ, REVIEW:리뷰}
        private String allowComment;  // 댓글허용 Y/N
        private String allowAttach;  // 첨부허용 Y/N
        private String allowLike;  // 좋아요허용 Y/N
        private String contentTypeCd;  // 내용유형 — BBM_CONTENT_TYPE {NONE:불가, TEXTAREA:textarea, HTMLEDITOR:htmleditor, HTML:HTML, TEXT:텍스트}
        private String scopeTypeCd;  // 접근범위 — SCOPE_TYPE_CD {PUBLIC:공개, PRIVATE:개인, ADMIN:관리자, ALL:전체}
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String bbmRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
