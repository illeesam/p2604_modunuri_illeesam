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
        private List<String> claimTypeCds;                 // 클레임유형 다중 필터 — CLAIM_TYPE_CD (CANCEL/RETURN/EXCHANGE)
        private List<String> claimStatusCds;                // 클레임상세상태 다중 필터 — CLAIM_ITEM_STATUS_CD
        @Size(max = 30) private String dlivCourierCd;       // 배송 택배사 필터 (strEq, 항목 자체 컬럼)
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
        private String orderItemId;  // 주문상품ID (YYMMDDhhmmss+rand4)
        private String orderId;  // 주문ID (od_order.)
        private String prodId;  // 상품ID (pd_prod.)
        private String prodSkuId;  // SKU ID (pd_prod_sku.prod_sku_id, 무옵션 시 NULL)
        private String prodOpt1Id;  // 옵션1 값ID (pd_prod_opt.opt_id)
        private String prodOpt2Id;  // 옵션2 값ID (pd_prod_opt.opt_id)
        private String prodNm;  // 상품명 (주문 시점 스냅샷)
        private String brandNm;  // 브랜드명 (주문 시점 스냅샷)
        private String dlivTmpltId;  // 배송비 템플릿ID 스냅샷
        private Long normalPrice;  // 정상가 (할인 전 1ea 가격)
        private Long unitPrice;  // 판매가 (단가, 옵션 추가금액 포함)
        private Integer orderQty;  // 주문수량
        private Long itemOrderAmt;  // 주문금액 (unit_price × order_qty)
        private Integer cancelQty;  // 취소수량
        private Long itemCancelAmt;  // 취소금액 (클레임 누적 취소액)
        private Integer completQty;  // 판매완료수량
        private Long itemCompletedAmt;  // 완료금액 (item_order_amt - item_cancel_amt)
        private Long orgUnitPrice;  // 원 단가 (주문 확정 시점 스냅샷)
        private Long orgItemOrderAmt;  // 원 주문금액 (주문 확정 시점 스냅샷)
        private Long orgDiscountAmt;  // 원 할인금액 (주문 확정 시점 스냅샷)
        private Long orgShippingFee;  // 원 배송료 (주문 확정 시점 스냅샷)
        private BigDecimal saveRate;  // 주문 시점 적립율 (%)
        private Long saveUseAmt;  // 사용 적립금 (주문상품별 안분금액)
        private Long saveSchdAmt;  // 적립 예정금액 (구매확정 전=예상, 확정 후=실적립)
        private String orderItemStatusCd;  // 품목 주문 상태 — ORDER_ITEM_STATUS_CD {ORDERED:주문완료, PAID:결제완료, PREPARING:준비중, SHIPPING:배송중, DELIVERED:배송완료, CONFIRMED:구매확정, CANCELLED:취소}
        private String orderItemStatusCdBefore;  // 변경 전 품목상태 — ORDER_ITEM_STATUS_CD
        private String claimYn;  // 클레임 진행 중 여부 Y/N
        private String buyConfirmYn;  // 구매확정여부 Y/N
        private LocalDate buyConfirmSchdDate;  // 구매확정 예정일 (배송완료 + N일 자동 설정)
        private LocalDateTime buyConfirmDate;  // 구매확정일시
        private String settleYn;  // 정산처리여부 Y/N
        private LocalDateTime settleDate;  // 정산처리일시
        private String reserveSaleYn;  // 예약판매여부 Y/N
        private LocalDateTime reserveDlivSchdDate;  // 예약판매 발송 예정일시
        private String bundleGroupId;  // 묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)
        private BigDecimal bundlePriceRate;  // 묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준
        private String giftId;  // 발급 사은품ID (pm_gift.gift_id)
        private Long outboundShippingFee;  // 해당 항목의 배송료 (부분배송 시)
        private String dlivCourierCd;  // 해당 항목의 배송 택배사 — COURIER {CJ:CJ대한통운, LOTTE:롯데택배, HANJIN:한진택배 외}
        private String dlivTrackingNo;  // 해당 항목의 배송 송장번호
        private LocalDateTime dlivShipDate;  // 해당 항목의 출고일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
        private String thumbnailUrl;  // 상품 썸네일 URL (pd_prod 현재값)
        private Long salePriceCurrent;  // 상품 현재 판매가 (pd_prod 현재값)
        private String prodNmCurrent;  // 상품 현재 상품명 (pd_prod 현재값)
        private String prodSkuCode;  // SKU 코드 (pd_prod_sku 조인)
        private String prodOptNm1;  // 옵션1명 (조인 표시용)
        private String prodOptNm2;  // 옵션2명 (조인 표시용)
        private String orderItemStatusCdNm;  // 품목상태 코드 라벨
        private String dlivCourierCdNm;  // 배송택배사 코드 라벨
        private String memberNm;  // 주문자명 (od_order 스냅샷)
        private String vendorNm;  // 판매업체명 (pd_prod → sy_vendor)
        private String mdUserNm;  // 담당MD명 (pd_prod → sy_user)
        private String categoryNm;  // 카테고리명 (pd_prod → pd_category)
        private Long settleSaleAmt;  // 정산 판매금액 합계 (st_settle_item 상관 서브쿼리)
        private Long settleCommissionAmt;  // 정산 수수료금액 합계 (st_settle_item 상관 서브쿼리)
        private Long settleVendorAmt;  // 정산 업체지급금액 합계 (st_settle_item 상관 서브쿼리)
        private Long discntUsageCount;  // 프로모션 할인 적용 건수 (pm_discnt_usage 상관 서브쿼리)
        private String discntUsageNm;  // 적용된 프로모션 할인명
        private String discntUsageTopId;  // 적용된 프로모션 할인ID (대표 1건)
        private Long discntUsageAmt;  // 프로모션 할인 적용금액 합계
        private Long couponUsageCount;  // 쿠폰 적용 건수 (pm_coupon_usage 상관 서브쿼리)
        private String couponUsageNm;  // 적용된 쿠폰명
        private String couponUsageTopId;  // 적용된 쿠폰ID (대표 1건)
        private Long couponUsageAmt;  // 쿠폰 할인 적용금액 합계
        private Long saveUsageCount;  // 적립금 사용 건수 (pm_save_usage 상관 서브쿼리)
        private Long saveUsageAmt;  // 적립금 사용금액 합계
        private String giftNm;  // 발급 사은품명 (pm_gift 조인)
        private String claimTypeCd;    // 클레임유형 — 최신 클레임 1건 대표 표시, CLAIM_TYPE_CD {CANCEL:취소, RETURN:반품, EXCHANGE:교환} (od_claim_item→od_claim 상관 서브쿼리)
        private String claimStatusCd;  // 클레임상세상태 — 최신 클레임항목 1건 대표 표시, CLAIM_ITEM_STATUS_CD {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
    }


    /** SaveItem — MD 대리주문 저장용 최소 주문항목 (필드 기본값 금지) */
    @Getter @Setter @NoArgsConstructor
    public static class SaveItem {
        private String  prodId;  // 상품ID
        private String  prodSkuId;  // SKU ID
        private String  prodNm;  // 상품명
        private Long    unitPrice;     // 판매 단가
        private Integer orderQty;      // 수량
        private Long    itemOrderAmt;  // 항목 주문금액 (단가 × 수량)
    }
}
