package com.shopjoy.ecadminapi.base.ec.pd.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

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
    private String dlivTmpltId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21)
    private String siteId;

    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("템플릿명")
    @Column(name = "dliv_tmplt_nm", length = 100, nullable = false)
    private String dlivTmpltNm;

    @Comment("배송방법코드 (코드: DLIV_METHOD)")
    @Column(name = "dliv_method_cd", length = 20)
    private String dlivMethodCd;

    @Comment("배송비결제유형 (코드: DLIV_PAY_TYPE) PREPAY:선결제/COD:착불")
    @Column(name = "dliv_pay_type_cd", length = 20)
    private String dlivPayTypeCd;

    @Comment("배송 택배사 코드")
    @Column(name = "dliv_courier_cd", length = 30)
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
    private String returnCourierCd;

    @Comment("반품지 우편번호")
    @Column(name = "return_addr_zip", length = 10)
    private String returnAddrZip;

    @Comment("반품지 주소")
    @Column(name = "return_addr", length = 200)
    private String returnAddr;

    @Comment("반품지 상세주소")
    @Column(name = "return_addr_detail", length = 200)
    private String returnAddrDetail;

    @Comment("반품지 전화번호")
    @Column(name = "return_tel_no", length = 20)
    private String returnTelNo;

    @Comment("기본배송지여부 Y/N")
    @Column(name = "base_dliv_yn", length = 1)
    private String baseDlivYn;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
