package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import com.shopjoy.ecadminapi.common.util.Sensitive;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 검색값
        @Size(max = 21) private String vendorId;  // 업체ID 검색값
        @Size(max = 21) private String pathId;  // 표시경로ID 검색값
        @Size(max = 50) private String vendorClassCd;  // 업체구분 검색값 — VENDOR_CLASS_CD {INDIVIDUAL:개인사업자, CORPORATION:법인사업자, TAX_EXEMPT:면세사업자, SIMPLIFIED:간이과세자}
        @Size(max = 50) private String vendorTypeCd;  // 업태 검색값
        @Size(max = 20) private String status;  // 상태 검색값 — VENDOR_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor ──────────────────────────────────────────
        private String vendorId;  // 판매/배송업체ID (YYMMDDhhmmss+rand4)
        private String vendorNo;  // 판매/배송업체등록번호
        private String corpNo;  // 법인등록번호 (선택)
        private String vendorNm;  // 상호 / 회사명
        private String vendorNmEn;  // 영문 상호
        private String ceoNm;  // 대표자명
        private String vendorTypeCd;  // 업태
        private String vendorItem;  // 종목
        private String vendorClassCd;  // 판매/배송업체구분 — VENDOR_CLASS_CD {INDIVIDUAL:개인사업자, CORPORATION:법인사업자, TAX_EXEMPT:면세사업자, SIMPLIFIED:간이과세자}
        private String vendorZipCode;  // 우편번호
        @Sensitive("address") private String vendorAddr;  // 주소
        @Sensitive("address") private String vendorAddrDetail;  // 상세주소
        @Sensitive("phone")   private String vendorPhone;  // 대표 전화
        private String vendorFax;  // 팩스
        @Sensitive("email")   private String vendorEmail;  // 대표 이메일
        private String vendorHomepage;  // 홈페이지
        private String vendorBankNm;  // 은행명
        @Sensitive("account") private String vendorBankAccount;  // 계좌번호
        @Sensitive("name")    private String vendorBankHolder;  // 예금주
        private String vendorRegUrl;  // 판매/배송업체등록증 첨부 URL
        private LocalDate openDate;  // 개업일자
        private LocalDate contractDate;  // 계약일자
        private String vendorStatusCd;  // 상태 — VENDOR_STATUS_CD {ACTIVE:활성, INACTIVE:비활성}
        private String pathId;  // 점(.) 구분 표시경로
        private String vendorRemark;  // 비고 (HTML 에디터)
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일

        // ── JOIN ──────────────────────────────────────────────
    }

}
