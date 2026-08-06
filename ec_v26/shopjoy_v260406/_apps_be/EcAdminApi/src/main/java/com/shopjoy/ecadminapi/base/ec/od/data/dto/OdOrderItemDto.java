package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class OdOrderItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String orderItemId;
        @Size(max = 21) private String orderId;        // 상위 FK 필터
        private List<String> orderIds;                 // 상위 FK 다건 IN
        @Size(max = 30) private String orderItemStatusCd;  // 품목상태 단건 필터 (strEq)
        private List<String> orderItemStatusCds;           // 품목상태 다중 필터 (strIn, BO multiCheck)
        @Size(max = 1)  private String claimYn;            // 클레임여부 필터 Y/N
        @Size(max = 21)  private String memberId;            // 회원 ID 필터 (EXISTS eq via od_order)
        @Size(max = 200) private String memberNm;           // 회원명 필터 (EXISTS LIKE via mb_member)
        @Size(max = 21)  private String vendorId;           // 판매업체 ID 필터 (EXISTS eq via pd_prod→sy_vendor)
        @Size(max = 200) private String vendorNm;           // 판매업체명 필터 (EXISTS LIKE via sy_vendor)
        @Size(max = 21)  private String mdUserId;           // 담당MD ID 필터 (EXISTS eq via pd_prod→sy_user)
        @Size(max = 200) private String mdUserNm;           // 담당MD명 필터 (EXISTS LIKE via sy_user)
        @Size(max = 21)  private String brandId;            // 브랜드 ID 필터 (EXISTS eq via pd_prod→sy_brand)
        @Size(max = 200) private String brandNm;            // 브랜드명 필터 (EXISTS LIKE via sy_brand)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String orderItemId;
        private String orderId;
        private String prodId;
        private String prodSkuId;
        private String prodOptId1;
        private String prodOptId2;
        private String prodNm;
        private String brandNm;
        private String dlivTmpltId;
        private Long normalPrice;
        private Long unitPrice;
        private Integer orderQty;
        private Long itemOrderAmt;
        private Integer cancelQty;
        private Long itemCancelAmt;
        private Integer completQty;
        private Long itemCompletedAmt;
        private Long orgUnitPrice;
        private Long orgItemOrderAmt;
        private Long orgDiscountAmt;
        private Long orgShippingFee;
        private BigDecimal saveRate;
        private Long saveUseAmt;
        private Long saveSchdAmt;
        private String orderItemStatusCd;
        private String orderItemStatusCdBefore;
        private String claimYn;
        private String buyConfirmYn;
        private LocalDate buyConfirmSchdDate;
        private LocalDateTime buyConfirmDate;
        private String settleYn;
        private LocalDateTime settleDate;
        private String reserveSaleYn;
        private LocalDateTime reserveDlivSchdDate;
        private String bundleGroupId;
        private BigDecimal bundlePriceRate;
        private String giftId;
        private Long outboundShippingFee;
        private String dlivCourierCd;
        private String dlivTrackingNo;
        private LocalDateTime dlivShipDate;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
        private String thumbnailUrl;
        private Long salePriceCurrent;
        private String prodNmCurrent;
        private String prodSkuCode;
        private String prodOptNm1;
        private String prodOptNm2;
        private String orderItemStatusCdNm;
        private String dlivCourierCdNm;
    }


    /** SaveItem — MD 대리주문 저장용 최소 주문항목 (필드 기본값 금지) */
    @Getter @Setter @NoArgsConstructor
    public static class SaveItem {
        private String  prodId;
        private String  prodSkuId;
        private String  prodNm;
        private Long    unitPrice;     // 판매 단가
        private Integer orderQty;      // 수량
        private Long    itemOrderAmt;  // 항목 주문금액 (단가 × 수량)
    }
}
