package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "st_settle_raw", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 정산 원천 데이터 엔티티
public class StSettleRaw {

    @Id
    @Column(name = "settle_raw_id", length = 21, nullable = false)
    private String settleRawId;

    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "raw_type_cd", length = 20, nullable = false)
    private String rawTypeCd;

    @Column(name = "raw_status_cd", length = 20)
    private String rawStatusCd;

    @Column(name = "raw_status_cd_before", length = 20)
    private String rawStatusCdBefore;

    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Column(name = "order_no", length = 30)
    private String orderNo;

    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Column(name = "order_item_status_cd", length = 20)
    private String orderItemStatusCd;

    @Column(name = "member_id", length = 21)
    private String memberId;

    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Column(name = "claim_item_id", length = 21)
    private String claimItemId;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "vendor_type_cd", length = 20)
    private String vendorTypeCd;

    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Column(name = "brand_id", length = 21)
    private String brandId;

    @Column(name = "brand_nm", length = 100)
    private String brandNm;

    @Column(name = "category_id_1", length = 20)
    private String categoryId1;

    @Column(name = "category_id_2", length = 20)
    private String categoryId2;

    @Column(name = "category_id_3", length = 20)
    private String categoryId3;

    @Column(name = "category_id_4", length = 20)
    private String categoryId4;

    @Column(name = "category_id_5", length = 20)
    private String categoryId5;

    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Column(name = "opt_item_id_1", length = 20)
    private String optItemId1;

    @Column(name = "opt_item_id_2", length = 20)
    private String optItemId2;

    @Column(name = "md_user_id", length = 21)
    private String mdUserId;

    @Column(name = "normal_price")
    private Long normalPrice;

    @Column(name = "unit_price")
    private Long unitPrice;

    @Column(name = "order_qty")
    private Integer orderQty;

    @Column(name = "item_price")
    private Long itemPrice;

    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Column(name = "coupon_discnt_amt")
    private Long couponDiscntAmt;

    @Column(name = "promo_discnt_amt")
    private Long promoDiscntAmt;

    @Column(name = "promo_id", length = 21)
    private String promoId;

    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Column(name = "discnt_id", length = 21)
    private String discntId;

    @Column(name = "voucher_id", length = 21)
    private String voucherId;

    @Column(name = "voucher_issue_id", length = 21)
    private String voucherIssueId;

    @Column(name = "voucher_use_amt")
    private Long voucherUseAmt;

    @Column(name = "cache_use_amt")
    private Long cacheUseAmt;

    @Column(name = "mileage_use_amt")
    private Long mileageUseAmt;

    @Column(name = "save_schd_amt")
    private Long saveSchdAmt;

    @Column(name = "gift_id", length = 21)
    private String giftId;

    @Column(name = "gift_amt")
    private Long giftAmt;

    @Column(name = "pay_method_cd", length = 20)
    private String payMethodCd;

    @Column(name = "buy_confirm_yn", length = 1)
    private String buyConfirmYn;

    @Column(name = "buy_confirm_date")
    private LocalDateTime buyConfirmDate;

    @Column(name = "bundle_price_rate")
    private BigDecimal bundlePriceRate;

    @Column(name = "settle_target_amt")
    private Long settleTargetAmt;

    @Column(name = "settle_fee_rate")
    private BigDecimal settleFeeRate;

    @Column(name = "settle_fee_amt")
    private Long settleFeeAmt;

    @Column(name = "settle_amt")
    private Long settleAmt;

    @Column(name = "settle_period", length = 7)
    private String settlePeriod;

    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Column(name = "close_yn", length = 1)
    private String closeYn;

    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Column(name = "settle_close_id", length = 21)
    private String settleCloseId;

    @Column(name = "erp_voucher_id", length = 21)
    private String erpVoucherId;

    @Column(name = "erp_voucher_line_no")
    private Integer erpVoucherLineNo;

    @Column(name = "erp_send_yn", length = 1)
    private String erpSendYn;

    @Column(name = "erp_send_date")
    private LocalDateTime erpSendDate;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}