package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdReviewCommentDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String reviewCommentId;  // 댓글ID (단건 조회 필터)
        @Size(max = 21) private String reviewId;        // 상위 FK 필터
        private List<String> reviewIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String reviewCommentId;  // 댓글ID
        private String reviewId;  // 리뷰ID (pd_review.review_id)
        private String parentReplyId;  // 상위댓글ID (대댓글)
        private String writerTypeCd;  // 작성자유형 — WRITER_TYPE_CD {ADMIN:관리자}, MEMBER/SELLER 등 회원 작성자 포함
        private String writerId;  // 작성자ID
        private String writerNm;  // 작성자명
        private String reviewReplyContent;  // 댓글 내용
        private String replyStatusCd;  // 상태 (ACTIVE/HIDDEN/DELETED)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
