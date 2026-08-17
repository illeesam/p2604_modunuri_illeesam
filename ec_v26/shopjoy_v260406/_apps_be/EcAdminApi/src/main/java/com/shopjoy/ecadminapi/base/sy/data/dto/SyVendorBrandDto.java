package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorBrandDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String vendorId;  // 업체ID 검색값
        @Size(max = 21) private String brandId;  // 브랜드ID 검색값
        @Size(max = 21) private String vendorBrandId;  // 업체브랜드ID 검색값
        @Size(max = 1)  private String useYn;  // 사용여부 검색값 Y/N
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor_brand ──────────────────────────────────────────
        private String vendorBrandId;  // 업체브랜드ID (PK)
        private String vendorId;  // 업체ID (sy_vendor.vendor_id)
        private String brandId;  // 브랜드ID (sy_brand.brand_id)
        private String isMain;  // 대표 브랜드 여부 Y/N
        private String contractCd;  // 계약유형 — CONTRACT_CD {CONSIGN:위탁}
        private LocalDate startDate;  // 계약 시작일
        private LocalDate endDate;  // 계약 종료일
        private BigDecimal commissionRate;  // 수수료율 (%)
        private Integer sortOrd;  // 정렬순서
        private String useYn;  // 사용여부 Y/N
        private String vendorBrandRemark;  // 비고
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
        private String vendorNm;  // 업체명 (JOIN)
        private String brandNm;  // 브랜드명 (JOIN)
    }

}
