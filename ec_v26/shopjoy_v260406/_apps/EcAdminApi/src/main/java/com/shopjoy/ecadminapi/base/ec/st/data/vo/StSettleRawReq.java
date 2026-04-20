package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleRaw;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleRawReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public StSettleRaw toEntity() {
        return StSettleRaw.builder()
                .settleRawId(settleRawId)
                .siteId(siteId)
                .rawTypeCd(rawTypeCd)
                .rawStatusCd(rawStatusCd)
                .rawStatusCdBefore(rawStatusCdBefore)
                .orderId(orderId)
                .orderNo(orderNo)
                .orderItemId(orderItemId)
                .orderDate(orderDate)
                .orderItemStatusCd(orderItemStatusCd)
                .memberId(memberId)
                .claimId(claimId)
                .claimItemId(claimItemId)
                .vendorId(vendorId)
                .vendorTypeCd(vendorTypeCd)
                .prodId(prodId)
                .prodNm(prodNm)
                .brandId(brandId)
                .brandNm(brandNm)
                .categoryId1(categoryId1)
                .categoryId2(categoryId2)
                .categoryId3(categoryId3)
                .categoryId4(categoryId4)
                .categoryId5(categoryId5)
                .skuId(skuId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .mdUserId(mdUserId)
                .normalPrice(normalPrice)
                .unitPrice(unitPrice)
                .orderQty(orderQty)
                .itemPrice(itemPrice)
                .discntAmt(discntAmt)
                .couponDiscntAmt(couponDiscntAmt)
                .promoDiscntAmt(promoDiscntAmt)
                .promoId(promoId)
                .couponId(couponId)
                .couponIssueId(couponIssueId)
                .discntId(discntId)
                .voucherId(voucherId)
                .voucherIssueId(voucherIssueId)
                .voucherUseAmt(voucherUseAmt)
                .cacheUseAmt(cacheUseAmt)
                .mileageUseAmt(mileageUseAmt)
                .saveSchdAmt(saveSchdAmt)
                .giftId(giftId)
                .giftAmt(giftAmt)
                .payMethodCd(payMethodCd)
                .buyConfirmYn(buyConfirmYn)
                .buyConfirmDate(buyConfirmDate)
                .bundlePriceRate(bundlePriceRate)
                .settleTargetAmt(settleTargetAmt)
                .settleFeeRate(settleFeeRate)
                .settleFeeAmt(settleFeeAmt)
                .settleAmt(settleAmt)
                .settlePeriod(settlePeriod)
                .settleId(settleId)
                .closeYn(closeYn)
                .closeDate(closeDate)
                .settleCloseId(settleCloseId)
                .erpVoucherId(erpVoucherId)
                .erpVoucherLineNo(erpVoucherLineNo)
                .erpSendYn(erpSendYn)
                .erpSendDate(erpSendDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
