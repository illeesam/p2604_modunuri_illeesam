package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PdReviewDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String reviewId;  // 리뷰ID (단건 조회 필터)
        @Size(max = 21) private String prodId;  // 상품ID 필터
        @Size(max = 20) private String reviewStatusCd;  // 리뷰상태 필터 — REVIEW_STATUS_CD {ACTIVE:정상, HIDDEN:숨김, DELETED:삭제}
        @Size(max = 5)  private String rating;  // 평점 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String reviewId;  // 리뷰ID (YYMMDDhhmmss+rand4)
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private String memberId;  // 회원ID (mb_member.member_id)
        private String reviewTitle;  // 리뷰 제목
        private String reviewContent;  // 리뷰 내용
        private BigDecimal rating;  // 평점 (1.0~5.0)
        private Integer helpfulCnt;  // 도움이 돼요 수
        private Integer unhelpfulCnt;  // 도움이 안 돼요 수
        private String reviewStatusCd;  // 상태 — REVIEW_STATUS_CD {ACTIVE:정상, HIDDEN:숨김, DELETED:삭제}
        private String reviewStatusCdBefore;  // 변경 전 리뷰상태 — REVIEW_STATUS_CD
        private LocalDateTime reviewDate;  // 리뷰작성일
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        // ── 연관정보 (getById / 목록 시 채움) ──
        private List<PdReviewCommentDto.Item> comments;   // 리뷰 댓글 목록
        private List<PdReviewAttachDto.Item> attaches;   // 리뷰 첨부 목록
    }

}
