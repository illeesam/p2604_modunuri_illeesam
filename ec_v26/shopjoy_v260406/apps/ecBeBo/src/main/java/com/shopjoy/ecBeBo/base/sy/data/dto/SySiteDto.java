package com.shopjoy.ecBeBo.base.sy.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SySiteDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 (도메인 전용 검색조건) ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID 검색값
        @Size(max = 21) private String pathId;  // 표시경로ID 검색값
        @Size(max = 20) private String status;  // 상태 검색값 — SITE_STATUS_CD {ACTIVE:활성, MAINTENANCE:점검중, INACTIVE:비활성}
        @Size(max = 20) private String typeCd;  // 사이트유형 검색값 — SITE_TYPE_CD {EC:이커머스, ADMIN:관리자, API:API}
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_site ──────────────────────────────────────────
        private String siteId;  // 사이트ID (YYMMDDhhmmss+rand4)
        private String siteNm;  // 사이트명
        private String siteCode;  // 사이트코드
        private String siteTypeCd;  // 사이트유형 — SITE_TYPE_CD {EC:이커머스, ADMIN:관리자, API:API}
        private String siteDomain;  // 도메인
        private String logoUrl;  // 로고URL
        private String faviconUrl;  // 파비콘URL
        private String siteDesc;  // 사이트설명
        private String siteEmail;  // 대표이메일
        private String sitePhone;  // 대표전화
        private String siteZipCode;  // 우편번호
        private String siteAddress;  // 주소
        private String siteBusinessNo;  // 사업자번호
        private String siteCeo;  // 대표자명
        private String siteStatusCd;  // 상태 — SITE_STATUS_CD {ACTIVE:활성, MAINTENANCE:점검중, INACTIVE:비활성}
        private String configJson;  // 확장설정 (JSON)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)

        // ── JOIN ──────────────────────────────────────────────
        private String siteTypeCdNm;  // 사이트유형 코드명 (JOIN)
        private String siteStatusCdNm;  // 상태 코드명 (JOIN)
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
