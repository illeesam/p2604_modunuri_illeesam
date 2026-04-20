package com.shopjoy.ecadminapi.base.ec.pm.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "pm_voucher", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 바우처(상품권) 엔티티
public class PmVoucher {

    @Id
    @Column(name = "voucher_id", length = 21, nullable = false)
    private String voucherId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "voucher_nm", length = 100, nullable = false)
    private String voucherNm;

    @Column(name = "voucher_type_cd", length = 20, nullable = false)
    private String voucherTypeCd;

    @Column(name = "voucher_value", nullable = false)
    private BigDecimal voucherValue;

    @Column(name = "min_order_amt")
    private Long minOrderAmt;

    @Column(name = "max_discnt_amt")
    private Long maxDiscntAmt;

    @Column(name = "expire_month")
    private Integer expireMonth;

    @Column(name = "voucher_status_cd", length = 20)
    private String voucherStatusCd;

    @Column(name = "voucher_status_cd_before", length = 20)
    private String voucherStatusCdBefore;

    @Lob
    @Column(name = "voucher_desc", columnDefinition = "TEXT")
    private String voucherDesc;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}