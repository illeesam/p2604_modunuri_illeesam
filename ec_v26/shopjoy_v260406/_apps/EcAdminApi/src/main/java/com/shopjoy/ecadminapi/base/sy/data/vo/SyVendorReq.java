package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyVendorReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public SyVendor toEntity() {
        return SyVendor.builder()
                .vendorId(vendorId)
                .siteId(siteId)
                .vendorNo(vendorNo)
                .corpNo(corpNo)
                .vendorNm(vendorNm)
                .vendorNmEn(vendorNmEn)
                .ceoNm(ceoNm)
                .vendorType(vendorType)
                .vendorItem(vendorItem)
                .vendorClassCd(vendorClassCd)
                .vendorZipCode(vendorZipCode)
                .vendorAddr(vendorAddr)
                .vendorAddrDetail(vendorAddrDetail)
                .vendorPhone(vendorPhone)
                .vendorFax(vendorFax)
                .vendorEmail(vendorEmail)
                .vendorHomepage(vendorHomepage)
                .vendorBankNm(vendorBankNm)
                .vendorBankAccount(vendorBankAccount)
                .vendorBankHolder(vendorBankHolder)
                .vendorRegUrl(vendorRegUrl)
                .openDate(openDate)
                .contractDate(contractDate)
                .vendorStatusCd(vendorStatusCd)
                .dispPath(dispPath)
                .vendorRemark(vendorRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
