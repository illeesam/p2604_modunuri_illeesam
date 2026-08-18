package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pd_dliv_tmplt", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 배송 템플릿 엔티티
@Comment("배송템플릿")
public class PdDlivTmplt extends BaseEntity {

    @Id
    @Comment("배송템플릿ID (YYMMDDhhmmss+rand4)")
    @Column(name = "dliv_tmplt_id", length = 21, nullable = false)
    @Size(max = 21, message = "dlivTmpltId 는 21자 이내여야 합니다.")
    private String dlivTmpltId;


    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("템플릿명")
    @Column(name = "dliv_tmplt_nm", length = 100, nullable = false)
    @Size(max = 100, message = "dlivTmpltNm 는 100자 이내여야 합니다.")
    private String dlivTmpltNm;

    @Comment("배송방법코드 (코드: DLIV_METHOD_CD)")
    @Column(name = "dliv_method_cd", length = 20)
    @Size(max = 20, message = "dlivMethodCd 는 20자 이내여야 합니다.")
    private String dlivMethodCd;

    @Comment("배송비결제유형 (코드: DLIV_PAY_TYPE_CD) PREPAY:선결제/COD:착불")
    @Column(name = "dliv_pay_type_cd", length = 20)
    @Size(max = 20, message = "dlivPayTypeCd 는 20자 이내여야 합니다.")
    private String dlivPayTypeCd;

    @Comment("배송 택배사 코드")
    @Column(name = "dliv_courier_cd", length = 30)
    @Size(max = 30, message = "dlivCourierCd 는 30자 이내여야 합니다.")
    private String dlivCourierCd;

    @Comment("기본 배송비")
    @Column(name = "dliv_cost")
    private Long dlivCost;

    @Comment("무료배송 최소 주문금액")
    @Column(name = "free_dliv_min_amt")
    private Long freeDlivMinAmt;

    @Comment("도서산간 추가배송비")
    @Column(name = "island_extra_cost")
    private Long islandExtraCost;

    @Comment("반품배송비 (편도)")
    @Column(name = "return_cost")
    private Long returnCost;

    @Comment("교환배송비 (왕복=반품+재발송)")
    @Column(name = "exchange_cost")
    private Long exchangeCost;

    @Comment("반품 택배사 코드")
    @Column(name = "return_courier_cd", length = 30)
    @Size(max = 30, message = "returnCourierCd 는 30자 이내여야 합니다.")
    private String returnCourierCd;

    @Comment("반품지 우편번호")
    @Column(name = "return_addr_zip", length = 10)
    @Size(max = 10, message = "returnAddrZip 는 10자 이내여야 합니다.")
    private String returnAddrZip;

    @Comment("반품지 주소")
    @Column(name = "return_addr", length = 200)
    @Size(max = 100, message = "returnAddr 는 100자 이내여야 합니다.")
    private String returnAddr;

    @Comment("반품지 상세주소")
    @Column(name = "return_addr_detail", length = 200)
    @Size(max = 100, message = "returnAddrDetail 는 100자 이내여야 합니다.")
    private String returnAddrDetail;

    @Comment("반품지 전화번호")
    @Column(name = "return_tel_no", length = 20)
    @Size(max = 20, message = "returnTelNo 는 20자 이내여야 합니다.")
    private String returnTelNo;

    @Comment("기본배송지여부 Y/N")
    @Column(name = "base_dliv_yn", length = 1)
    @Size(max = 1, message = "baseDlivYn 는 1자 이내여야 합니다.")
    private String baseDlivYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
