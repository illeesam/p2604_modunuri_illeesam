package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class SyVendorDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String pathId;
        @Size(max = 50) private String vendorClassCd;
        @Size(max = 20) private String status;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor ──────────────────────────────────────────
        private String vendorId;
        private String siteId;
        private String vendorNo;
        private String corpNo;
        private String vendorNm;
        private String vendorNmEn;
        private String ceoNm;
        private String vendorType;
        private String vendorItem;
        private String vendorClassCd;
        private String vendorZipCode;
        private String vendorAddr;
        private String vendorAddrDetail;
        private String vendorPhone;
        private String vendorFax;
        private String vendorEmail;
        private String vendorHomepage;
        private String vendorBankNm;
        private String vendorBankAccount;
        private String vendorBankHolder;
        private String vendorRegUrl;
        private LocalDate openDate;
        private LocalDate contractDate;
        private String vendorStatusCd;
        private String pathId;
        private String vendorRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
        private String siteNm;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
