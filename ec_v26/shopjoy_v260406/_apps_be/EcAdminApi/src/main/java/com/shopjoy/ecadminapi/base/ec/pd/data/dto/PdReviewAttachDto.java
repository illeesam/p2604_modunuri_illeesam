package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdReviewAttachDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String reviewAttachId;  // 미디어ID (단건 조회 필터)
        @Size(max = 21) private String prodId;  // 상품ID 필터
        @Size(max = 21) private String reviewId;        // 상위 FK 필터
        private List<String> reviewIds;                 // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String reviewAttachId;  // 미디어ID
        private String reviewId;  // 리뷰ID (pd_review.review_id)
        private String attachId;  // 첨부파일ID (sy_attach.attach_id) — url·파일명 여기서 조회
        private String mediaTypeCd;  // 미디어유형 — MEDIA_TYPE_CD {IMAGE:이미지, VIDEO:동영상, DOCUMENT:문서}
        private String thumbUrl;  // 동영상 썸네일URL (이미지는 sy_attach.url 사용)
        private Integer sortOrd;  // 정렬순서
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
