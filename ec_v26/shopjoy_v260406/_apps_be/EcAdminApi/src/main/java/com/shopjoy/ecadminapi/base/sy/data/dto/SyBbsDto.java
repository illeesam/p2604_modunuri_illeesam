package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBbsDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String bbsId;  // 게시물ID 필터
        @Size(max = 21) private String bbmId;  // 게시판ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 20) private String status;  // 상태 필터 — BBS_STATUS {ACTIVE:활성, HIDDEN:숨김, DELETED:삭제}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_bbs ──────────────────────────────────────────
        private String bbsId;  // 게시물ID (YYMMDDhhmmss+rand4)
        private String bbmId;  // 게시판ID
        private String parentBbsId;  // 부모게시물ID (답글)
        private String memberId;  // 작성자 회원ID
        private String authorNm;  // 작성자명
        private String bbsTitle;  // 제목
        private String contentHtml;  // 내용 (HTML)
        private Integer viewCount;  // 조회수
        private Integer likeCount;  // 좋아요수
        private Integer commentCount;  // 댓글수
        private String isFixed;  // 상단고정 Y/N
        private String bbsStatusCd;  // 상태 — BBS_STATUS {ACTIVE:활성, HIDDEN:숨김, DELETED:삭제}
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────
        private String bbmNm;  // 게시판명
    }

}
