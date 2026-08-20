package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "pm_voucher", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 바우처(상품권) 엔티티
@Comment("상품권")
public class PmVoucher extends BaseEntity {

    @Id
    @Comment("상품권ID (YYMMDDhhmmss+rand4)")
    @Column(name = "voucher_id", length = 21, nullable = false)
    @Size(max = 21, message = "voucherId 는 21자 이내여야 합니다.")
    private String voucherId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("상품권명")
    @Column(name = "voucher_nm", length = 100, nullable = false)
    @Size(max = 100, message = "voucherNm 는 100자 이내여야 합니다.")
    private String voucherNm;

    @Comment("유형 (코드: VOUCHER_TYPE_CD — AMOUNT/RATE)")
    @Column(name = "voucher_type_cd", length = 20, nullable = false)
    @Size(max = 20, message = "voucherTypeCd 는 20자 이내여야 합니다.")
    private String voucherTypeCd;

    @Comment("권면금액 또는 할인율")
    @Column(name = "voucher_value", nullable = false)
    private BigDecimal voucherValue;

    @Comment("사용 최소주문금액")
    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Comment("최대할인한도 (정률권)")
    @Column(name = "max_discnt_amt")
    private Long maxDiscntAmt;

    @Comment("유효기간 (발급 후 N개월, NULL=무제한)")
    @Column(name = "expire_month")
    private Integer expireMonth;

    @Comment("상태 (코드: VOUCHER_STATUS_CD)")
    @Column(name = "voucher_status_cd", length = 20)
    @Size(max = 20, message = "voucherStatusCd 는 20자 이내여야 합니다.")
    private String voucherStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "voucher_status_cd_before", length = 20)
    @Size(max = 20, message = "voucherStatusCdBefore 는 20자 이내여야 합니다.")
    private String voucherStatusCdBefore;

    @Comment("상품권 설명")
    @Column(name = "voucher_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "voucherDesc 는 500,000자 이내여야 합니다.")
    private String voucherDesc;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

}
