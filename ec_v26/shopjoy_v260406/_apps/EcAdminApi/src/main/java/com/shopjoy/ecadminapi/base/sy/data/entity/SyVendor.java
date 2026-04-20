package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_vendor", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 업체(판매자) 엔티티
public class SyVendor {

    @Id
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_no", length = 20, nullable = false)
    private String vendorNo;

    @Column(name = "corp_no", length = 20)
    private String corpNo;

    @Column(name = "vendor_nm", length = 100, nullable = false)
    private String vendorNm;

    @Column(name = "vendor_nm_en", length = 100)
    private String vendorNmEn;

    @Column(name = "ceo_nm", length = 50)
    private String ceoNm;

    @Column(name = "vendor_type", length = 50)
    private String vendorType;

    @Column(name = "vendor_item", length = 100)
    private String vendorItem;

    @Column(name = "vendor_class_cd", length = 20)
    private String vendorClassCd;

    @Column(name = "vendor_zip_code", length = 10)
    private String vendorZipCode;

    @Column(name = "vendor_addr", length = 200)
    private String vendorAddr;

    @Column(name = "vendor_addr_detail", length = 200)
    private String vendorAddrDetail;

    @Column(name = "vendor_phone", length = 20)
    private String vendorPhone;

    @Column(name = "vendor_fax", length = 20)
    private String vendorFax;

    @Column(name = "vendor_email", length = 100)
    private String vendorEmail;

    @Column(name = "vendor_homepage", length = 200)
    private String vendorHomepage;

    @Column(name = "vendor_bank_nm", length = 50)
    private String vendorBankNm;

    @Column(name = "vendor_bank_account", length = 50)
    private String vendorBankAccount;

    @Column(name = "vendor_bank_holder", length = 50)
    private String vendorBankHolder;

    @Column(name = "vendor_reg_url", length = 500)
    private String vendorRegUrl;

    @Column(name = "open_date")
    private LocalDate openDate;

    @Column(name = "contract_date")
    private LocalDate contractDate;

    @Column(name = "vendor_status_cd", length = 20)
    private String vendorStatusCd;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "vendor_remark", length = 500)
    private String vendorRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}