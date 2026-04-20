package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorDto {

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
    private String dispPath;
    private String vendorRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
