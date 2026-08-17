package com.shopjoy.ecadminapi.base.ec.cm.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class CmBlogReplyDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String blogReplyId;  // 댓글ID 필터
        @Size(max = 21) private String blogId;          // 상위 FK 필터
        private List<String> blogIds;                  // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String blogReplyId;  // 댓글ID
        private String blogId;  // 블로그ID
        private String parentCommentId;  // 대댓글 부모ID
        private String writerId;  // 작성자ID
        private String writerNm;  // 작성자명
        private String blogCommentContent;  // 댓글 내용
        private String commentStatusCd;  // 상태 — COMMENT_STATUS_CD {ACTIVE:정상, HIDDEN:숨김, DELETED:삭제}
        private String commentStatusCdBefore;  // 변경 전 댓글상태 — COMMENT_STATUS_CD {ACTIVE:정상, HIDDEN:숨김, DELETED:삭제}
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
