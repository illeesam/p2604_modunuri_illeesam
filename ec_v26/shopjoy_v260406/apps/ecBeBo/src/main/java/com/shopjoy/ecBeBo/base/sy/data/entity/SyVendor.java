package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;


    @Comment("판매/배송업체등록번호")
    @Column(name = "vendor_no", length = 20, nullable = false)
    @Size(max = 20, message = "vendorNo 는 20자 이내여야 합니다.")
    private String vendorNo;

    @Comment("법인등록번호 (선택)")
    @Column(name = "corp_no", length = 20)
    @Size(max = 20, message = "corpNo 는 20자 이내여야 합니다.")
    private String corpNo;

    @Comment("상호 / 회사명")
    @Column(name = "vendor_nm", length = 100, nullable = false)
    @Size(max = 100, message = "vendorNm 는 100자 이내여야 합니다.")
    private String vendorNm;

    @Comment("영문 상호")
    @Column(name = "vendor_nm_en", length = 100)
    @Size(max = 100, message = "vendorNmEn 는 100자 이내여야 합니다.")
    private String vendorNmEn;

    @Comment("대표자명")
    @Column(name = "ceo_nm", length = 50)
    @Size(max = 50, message = "ceoNm 는 50자 이내여야 합니다.")
    private String ceoNm;

    @Comment("업태")
    @Column(name = "vendor_type_cd", length = 50)
    @Size(max = 50, message = "vendorTypeCd 는 50자 이내여야 합니다.")
    private String vendorTypeCd;

    @Comment("종목")
    @Column(name = "vendor_item", length = 100)
    @Size(max = 100, message = "vendorItem 는 100자 이내여야 합니다.")
    private String vendorItem;

    @Comment("판매/배송업체구분 (코드: VENDOR_CLASS_CD)")
    @Column(name = "vendor_class_cd", length = 20)
    @Size(max = 20, message = "vendorClassCd 는 20자 이내여야 합니다.")
    private String vendorClassCd;

    @Comment("우편번호")
    @Column(name = "vendor_zip_code", length = 10)
    @Size(max = 10, message = "vendorZipCode 는 10자 이내여야 합니다.")
    private String vendorZipCode;

    @Comment("주소")
    @Column(name = "vendor_addr", length = 200)
    @Size(max = 200, message = "vendorAddr 는 200자 이내여야 합니다.")
    private String vendorAddr;

    @Comment("상세주소")
    @Column(name = "vendor_addr_detail", length = 200)
    @Size(max = 200, message = "vendorAddrDetail 는 200자 이내여야 합니다.")
    private String vendorAddrDetail;

    @Comment("대표 전화")
    @Column(name = "vendor_phone", length = 20)
    @Size(max = 20, message = "vendorPhone 는 20자 이내여야 합니다.")
    private String vendorPhone;

    @Comment("팩스")
    @Column(name = "vendor_fax", length = 20)
    @Size(max = 20, message = "vendorFax 는 20자 이내여야 합니다.")
    private String vendorFax;

    @Comment("대표 이메일")
    @Column(name = "vendor_email", length = 100)
    @Size(max = 100, message = "vendorEmail 는 100자 이내여야 합니다.")
    private String vendorEmail;

    @Comment("홈페이지")
    @Column(name = "vendor_homepage", length = 200)
    @Size(max = 200, message = "vendorHomepage 는 200자 이내여야 합니다.")
    private String vendorHomepage;

    @Comment("은행명")
    @Column(name = "vendor_bank_nm", length = 50)
    @Size(max = 50, message = "vendorBankNm 는 50자 이내여야 합니다.")
    private String vendorBankNm;

    @Comment("계좌번호")
    @Column(name = "vendor_bank_account", length = 50)
    @Size(max = 50, message = "vendorBankAccount 는 50자 이내여야 합니다.")
    private String vendorBankAccount;

    @Comment("예금주")
    @Column(name = "vendor_bank_holder", length = 50)
    @Size(max = 50, message = "vendorBankHolder 는 50자 이내여야 합니다.")
    private String vendorBankHolder;

    @Comment("판매/배송업체등록증 첨부 URL")
    @Column(name = "vendor_reg_url", length = 500)
    @Size(max = 500, message = "vendorRegUrl 는 500자 이내여야 합니다.")
    private String vendorRegUrl;

    @Comment("개업일자")
    @Column(name = "open_date")
    private LocalDate openDate;

    @Comment("계약일자")
    @Column(name = "contract_date")
    private LocalDate contractDate;

    @Comment("상태 (코드: VENDOR_STATUS_CD)")
    @Column(name = "vendor_status_cd", length = 20)
    @Size(max = 20, message = "vendorStatusCd 는 20자 이내여야 합니다.")
    private String vendorStatusCd;

    @Comment("점(.) 구분 표시경로")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

    @Comment("비고 (HTML 에디터)")
    @Column(name = "vendor_remark", columnDefinition = "TEXT")
    @Size(max = 500000, message = "vendorRemark 는 500,000자 이내여야 합니다.")
    private String vendorRemark;

}
