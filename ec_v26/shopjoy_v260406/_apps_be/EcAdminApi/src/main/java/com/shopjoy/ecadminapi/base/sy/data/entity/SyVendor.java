package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_vendor", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체(판매자) 엔티티
@Comment("판매/배송업체 (사업체/법인)")
public class SyVendor extends BaseEntity {

    @Id
    @Comment("판매/배송업체ID (YYMMDDhhmmss+rand4)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("판매/배송업체등록번호")
    @Column(name = "vendor_no", length = 20, nullable = false)
    private String vendorNo;

    @Comment("법인등록번호 (선택)")
    @Column(name = "corp_no", length = 20)
    private String corpNo;

    @Comment("상호 / 회사명")
    @Column(name = "vendor_nm", length = 100, nullable = false)
    private String vendorNm;

    @Comment("영문 상호")
    @Column(name = "vendor_nm_en", length = 100)
    private String vendorNmEn;

    @Comment("대표자명")
    @Column(name = "ceo_nm", length = 50)
    private String ceoNm;

    @Comment("업태")
    @Column(name = "vendor_type", length = 50)
    private String vendorType;

    @Comment("종목")
    @Column(name = "vendor_item", length = 100)
    private String vendorItem;

    @Comment("판매/배송업체구분 (코드: VENDOR_CLASS)")
    @Column(name = "vendor_class_cd", length = 20)
    private String vendorClassCd;

    @Comment("우편번호")
    @Column(name = "vendor_zip_code", length = 10)
    private String vendorZipCode;

    @Comment("주소")
    @Column(name = "vendor_addr", length = 200)
    private String vendorAddr;

    @Comment("상세주소")
    @Column(name = "vendor_addr_detail", length = 200)
    private String vendorAddrDetail;

    @Comment("대표 전화")
    @Column(name = "vendor_phone", length = 20)
    private String vendorPhone;

    @Comment("팩스")
    @Column(name = "vendor_fax", length = 20)
    private String vendorFax;

    @Comment("대표 이메일")
    @Column(name = "vendor_email", length = 100)
    private String vendorEmail;

    @Comment("홈페이지")
    @Column(name = "vendor_homepage", length = 200)
    private String vendorHomepage;

    @Comment("은행명")
    @Column(name = "vendor_bank_nm", length = 50)
    private String vendorBankNm;

    @Comment("계좌번호")
    @Column(name = "vendor_bank_account", length = 50)
    private String vendorBankAccount;

    @Comment("예금주")
    @Column(name = "vendor_bank_holder", length = 50)
    private String vendorBankHolder;

    @Comment("판매/배송업체등록증 첨부 URL")
    @Column(name = "vendor_reg_url", length = 500)
    private String vendorRegUrl;

    @Comment("개업일자")
    @Column(name = "open_date")
    private LocalDate openDate;

    @Comment("계약일자")
    @Column(name = "contract_date")
    private LocalDate contractDate;

    @Comment("상태 (코드: VENDOR_STATUS)")
    @Column(name = "vendor_status_cd", length = 20)
    private String vendorStatusCd;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("비고")
    @Column(name = "vendor_remark", length = 500)
    private String vendorRemark;

}
