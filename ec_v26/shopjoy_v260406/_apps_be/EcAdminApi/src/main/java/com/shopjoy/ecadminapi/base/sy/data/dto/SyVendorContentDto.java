package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyVendorContentDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String vendorId;  // 업체ID 검색값
        @Size(max = 21) private String vendorContentId;  // 업체콘텐츠ID 검색값
        @Size(max = 50) private String contentTypeCd;  // 콘텐츠유형 검색값 — VENDOR_CONTENT_TYPE {INTRO:업체소개, POLICY:정책/규정, NOTICE:공지사항, TERMS:이용약관}
        @Size(max = 20) private String status;  // 상태 검색값 — VENDOR_CONTENT_STATUS_CD {DRAFT:임시저장, ACTIVE:게시중, INACTIVE:비게시}
        @Size(max = 1)  private String useYn;  // 사용여부 검색값 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_content ──────────────────────────────────────────
        private String vendorContentId;  // 업체콘텐츠ID (PK)
        private String vendorId;  // 업체ID (sy_vendor.vendor_id)
        private String contentTypeCd;  // 콘텐츠유형 — VENDOR_CONTENT_TYPE {INTRO:업체소개, POLICY:정책/규정, NOTICE:공지사항, TERMS:이용약관}
        private String vendorContentTitle;  // 제목
        private String vendorContentSubtitle;  // 부제
        private String contentHtml;  // 본문 (HTML)
        private String thumbUrl;  // 썸네일 URL
        private String imageUrl;  // 대표 이미지 URL
        private String linkUrl;  // 링크 URL
        private String langCd;  // 언어코드 (ko/en/ja)
        private LocalDateTime startDate;  // 노출 시작일시
        private LocalDateTime endDate;  // 노출 종료일시
        private Integer sortOrd;  // 정렬순서
        private String vendorContentStatusCd;  // 상태 — VENDOR_CONTENT_STATUS_CD {DRAFT:임시저장, ACTIVE:게시중, INACTIVE:비게시}
        private String useYn;  // 사용여부 Y/N
        private Integer viewCount;  // 조회수
        private String vendorContentRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;  // 업체명 (JOIN)
    }

}
