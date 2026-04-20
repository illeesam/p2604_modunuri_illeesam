package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleRawDto {

    // ── st_settle_raw ──────────────────────────────────────────
    private String settleRawId;
    private String siteId;
    private String rawTypeCd;
    private String rawStatusCd;
    private String rawStatusCdBefore;
    private String orderId;
    private String orderNo;
    private String orderItemId;
    private LocalDateTime orderDate;
    private String orderItemStatusCd;
    private String memberId;
    private String claimId;
    private String claimItemId;
    private String vendorId;
    private String vendorTypeCd;
    private String prodId;
    private String prodNm;
    private String brandId;
    private String brandNm;
    private String categoryId1;
    private String categoryId2;
    private String categoryId3;
    private String categoryId4;
    private String categoryId5;
    private String skuId;
    private String optItemId1;
    private String optItemId2;
    private String mdUserId;
    private Long normalPrice;
    private Long unitPrice;
    private Integer orderQty;
    private Long itemPrice;
    private Long discntAmt;
    private Long couponDiscntAmt;
    private Long promoDiscntAmt;
    private String promoId;
    private String couponId;
    private String couponIssueId;
    private String discntId;
    private String voucherId;
    private String voucherIssueId;
    private Long voucherUseAmt;
    private Long cacheUseAmt;
    private Long mileageUseAmt;
    private Long saveSchdAmt;
    private String giftId;
    private Long giftAmt;
    private String payMethodCd;
    private String buyConfirmYn;
    private LocalDateTime buyConfirmDate;
    private BigDecimal bundlePriceRate;
    private Long settleTargetAmt;
    private BigDecimal settleFeeRate;
    private Long settleFeeAmt;
    private Long settleAmt;
    private String settlePeriod;
    private String settleId;
    private String closeYn;
    private LocalDateTime closeDate;
    private String settleCloseId;
    private String erpVoucherId;
    private Integer erpVoucherLineNo;
    private String erpSendYn;
    private LocalDateTime erpSendDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
