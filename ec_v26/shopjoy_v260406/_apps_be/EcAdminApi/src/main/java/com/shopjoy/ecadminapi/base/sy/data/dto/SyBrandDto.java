package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class SyBrandDto {

    /** 조회 요청 (목록/페이징 검색조건) */
    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {

        // ── 고유필드 ────────────────────────
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String brandId;  // 브랜드ID 필터
        @Size(max = 21) private String pathId;  // 표시경로ID 필터
        @Size(max = 21) private String vendorId;  // 업체ID 필터
        @Size(max = 1)  private String useYn;  // 사용여부 필터 Y/N
    }

    /** 단건/목록 항목 */
    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_brand ──────────────────────────────────────────
        private String brandId;  // 브랜드ID (YYMMDDhhmmss+rand4)
        private String brandCode;  // 브랜드코드
        private String brandNm;  // 브랜드명 (한글)
        private String brandEnNm;  // 브랜드영문명
        private String pathId;  // 점(.) 구분 표시경로 (트리 빌드용)
        private String logoUrl;  // 로고URL
        private String vendorId;  // 업체ID
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String brandRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;  // 업체명
    }

    /** 응답 (pageList + 페이징 메타 + 조회조건 echo) */
}
