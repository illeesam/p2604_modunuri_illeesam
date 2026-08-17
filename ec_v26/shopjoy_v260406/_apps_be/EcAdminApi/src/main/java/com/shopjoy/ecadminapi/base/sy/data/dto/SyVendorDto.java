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
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String vendorId;
        @Size(max = 21) private String pathId;
        @Size(max = 50) private String vendorClassCd;
        @Size(max = 50) private String vendorTypeCd;
        @Size(max = 20) private String status;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {

        // ── sy_vendor ──────────────────────────────────────────
        private String vendorId;
        private String vendorNo;
        private String corpNo;
        private String vendorNm;
        private String vendorNmEn;
        private String ceoNm;
        private String vendorTypeCd;
        private String vendorItem;
        private String vendorClassCd;
        private String vendorZipCode;
        @Sensitive("address") private String vendorAddr;
        @Sensitive("address") private String vendorAddrDetail;
        @Sensitive("phone")   private String vendorPhone;
        private String vendorFax;
        @Sensitive("email")   private String vendorEmail;
        private String vendorHomepage;
        private String vendorBankNm;
        @Sensitive("account") private String vendorBankAccount;
        @Sensitive("name")    private String vendorBankHolder;
        private String vendorRegUrl;
        private LocalDate openDate;
        private LocalDate contractDate;
        private String vendorStatusCd;
        private String pathId;
        private String vendorRemark;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;

        // ── JOIN ──────────────────────────────────────────────
    }

}
