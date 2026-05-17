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
    private String voucherId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("상품권명")
    @Column(name = "voucher_nm", length = 100, nullable = false)
    private String voucherNm;

    @Comment("유형 (코드: VOUCHER_TYPE — AMOUNT/RATE)")
    @Column(name = "voucher_type_cd", length = 20, nullable = false)
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

    @Comment("상태 (코드: VOUCHER_STATUS)")
    @Column(name = "voucher_status_cd", length = 20)
    private String voucherStatusCd;

    @Comment("변경 전 상태")
    @Column(name = "voucher_status_cd_before", length = 20)
    private String voucherStatusCdBefore;

    @Comment("상품권 설명")
    @Column(name = "voucher_desc", columnDefinition = "TEXT")
    private String voucherDesc;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

}
