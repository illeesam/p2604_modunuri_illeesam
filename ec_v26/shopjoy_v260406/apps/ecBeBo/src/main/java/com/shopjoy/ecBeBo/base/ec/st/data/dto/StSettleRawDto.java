package com.shopjoy.ecBeBo.base.ec.st.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class StSettleRawDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;               // 사이트ID 필터
        @Size(max = 21) private String settleRawId;          // 수집원장ID 필터
        @Size(max = 21) private String orderId;              // 주문ID 필터
        @Size(max = 21) private String orderItemId;          // 주문항목ID 필터
        @Size(max = 21) private String claimId;              // 클레임ID 필터
        @Size(max = 21) private String claimItemId;          // 클레임항목ID 필터
        @Size(max = 20) private String rawTypeCd;            // 수집유형 필터 — RAW_TYPE_CD (ORDER/CLAIM)
        @Size(max = 20) private String rawStatusCd;          // 수집상태 필터 — RAW_STATUS_CD
        @Size(max = 20) private String vendorTypeCd;         // 업체구분 필터 — VENDOR_TYPE_CD (SALE/DLIV/EXTERNAL)
        @Size(max = 20) private String payMethodCd;          // 결제수단 필터 — PAY_METHOD
        @Size(max = 1)  private String buyConfirmYn;         // 구매확정여부 필터 Y/N
        @Size(max = 1)  private String closeYn;              // 정산마감 완료여부 필터 Y/N
        @Size(max = 1)  private String erpSendYn;            // ERP 전송여부 필터 Y/N
        @Size(max = 7)  private String settlePeriod;         // 정산기간 필터 (YYYY-MM)
        @Size(max = 20) private String orderItemStatusCd;    // 수집 시점 주문상태 필터 — ORDER_ITEM_STATUS_CD
        private Long amtFrom;                                 // 정산금액 범위 필터 — 시작
        private Long amtTo;                                   // 정산금액 범위 필터 — 끝
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleRawId;                 // 수집원장ID (YYMMDDhhmmss+rand4)
        private String rawTypeCd;                     // 수집유형 — RAW_TYPE_CD (ORDER/CLAIM)
        private String rawStatusCd;                     // 수집상태 — RAW_STATUS_CD
        private String rawStatusCdBefore;                 // 변경 전 수집상태
        private String orderId;                             // 주문ID (od_order.order_id)
        private String orderNo;                               // 주문번호 스냅샷
        private String orderItemId;                             // 주문상품ID (od_order_item.order_item_id)
        private LocalDateTime orderDate;                          // 주문일시 스냅샷
        private String orderItemStatusCd;                          // 수집 시점 주문상태 스냅샷 — ORDER_ITEM_STATUS_CD
        private String memberId;                                    // 주문 회원ID 스냅샷 (mb_member.member_id)
        private String claimId;                                      // 클레임ID (클레임 수집 시)
        private String claimItemId;                                   // 클레임상품ID (클레임 수집 시)
        private String vendorId;                                       // 업체ID
        private String vendorTypeCd;                                    // 업체구분 — VENDOR_TYPE_CD (SALE/DLIV/EXTERNAL)
        private String prodId;                                           // 상품ID
        private String prodNm;                                            // 상품명 스냅샷
        private String brandId;                                            // 브랜드ID 스냅샷 (sy_brand.brand_id)
        private String brandNm;                                             // 브랜드명 스냅샷
        private String categoryId1;                                         // 카테고리 1단계(대분류) ID 스냅샷
        private String categoryId2;                                         // 카테고리 2단계(중분류) ID 스냅샷
        private String categoryId3;                                         // 카테고리 3단계(소분류) ID 스냅샷
        private String categoryId4;                                         // 카테고리 4단계 ID 스냅샷
        private String categoryId5;                                         // 카테고리 5단계 ID 스냅샷
        private String prodSkuId;                                            // SKU ID 스냅샷 (pd_prod_sku.prod_sku_id)
        private String prodOpt1Id;                                            // 옵션1 값ID 스냅샷 (pd_prod_opt.opt_id)
        private String prodOpt2Id;                                            // 옵션2 값ID 스냅샷 (pd_prod_opt.opt_id)
        private String mdUserId;                                               // 담당MD (sy_user.user_id)
        private Long normalPrice;                                               // 정상가 스냅샷 (할인 전 1ea 가격)
        private Long unitPrice;                                                  // 단가 (옵션 추가금액 포함)
        private Integer orderQty;                                                 // 주문수량
        private Long itemPrice;                                                    // 소계 (unit_price × order_qty)
        private Long discntAmt;                                                     // 직접할인금액
        private Long couponDiscntAmt;                                                // 쿠폰할인금액
        private Long promoDiscntAmt;                                                  // 프로모션할인금액
        private String promoId;                                                        // 프로모션ID (pm_event.event_id)
        private String couponId;                                                        // 쿠폰ID (pm_coupon.coupon_id)
        private String couponIssueId;                                                    // 쿠폰발급ID (pm_coupon_issue.coupon_issue_id)
        private String discntId;                                                          // 할인ID (pm_discnt.discnt_id)
        private String voucherId;                                                          // 상품권ID (pm_voucher.voucher_id)
        private String voucherIssueId;                                                      // 상품권발급ID (pm_voucher_issue.voucher_issue_id)
        private Long voucherUseAmt;                                                           // 상품권 사용금액
        private Long cacheUseAmt;                                                              // 캐쉬(적립금) 사용금액
        private Long mileageUseAmt;                                                             // 적립금 사용금액
        private Long saveSchdAmt;                                                                // 적립 예정금액 (구매확정 전=예상, 확정 후=실적립)
        private String giftId;                                                                     // 사은품ID (pm_gift.gift_id)
        private Long giftAmt;                                                                        // 사은품 원가금액 (정산 차감 대상)
        private String payMethodCd;                                                                    // 결제수단 — PAY_METHOD
        private String buyConfirmYn;                                                                     // 구매확정여부 Y/N
        private LocalDateTime buyConfirmDate;                                                             // 구매확정일시
        private BigDecimal bundlePriceRate;                                                                // 묶음 안분율 (%) — 부분 정산 계산 기준
        private Long settleTargetAmt;                                                                       // 정산대상금액 (item_price - 모든 할인)
        private BigDecimal settleFeeRate;                                                                     // 수수료율 (%)
        private Long settleFeeAmt;                                                                             // 수수료금액
        private Long settleAmt;                                                                                 // 정산금액 (settle_target_amt - settle_fee_amt)
        private String settlePeriod;                                                                             // 정산기간 (YYYY-MM)
        private String settleId;                                                                                   // 정산집계ID (st_settle.settle_id, 집계 후 연결)
        private String closeYn;                                                                                     // 정산마감 완료 여부 Y/N
        private LocalDateTime closeDate;                                                                             // 마감일시
        private String settleCloseId;                                                                                 // 정산마감ID (st_settle_close.settle_close_id)
        private String erpVoucherId;                                                                                    // ERP 전표ID (st_erp_voucher.erp_voucher_id)
        private Integer erpVoucherLineNo;                                                                                // ERP 전표 라인번호 (st_erp_voucher_line.line_no)
        private String erpSendYn;                                                                                          // ERP 전송 여부 Y/N
        private LocalDateTime erpSendDate;                                                                                  // ERP 전송일시
        private String regBy;                                                                                               // 등록자
        private LocalDateTime regDate;                                                                                       // 등록일시
        private String regSiteId;                                                                                             // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;                                                                                                  // 수정자
        private LocalDateTime updDate;                                                                                          // 수정일시
        // 연관 엔티티명 (조인 alias)
        private String siteNm;             // 사이트명
        private String orderNm;            // 주문명 (표시용)
        private String orderItemNm;        // 주문항목명 (표시용)
        private String memberNm;           // 회원명
        private String claimNm;            // 클레임명 (표시용)
        private String claimItemNm;        // 클레임항목명 (표시용)
        private String vendorNm;           // 업체명
        private String prodIdNm;           // 상품명 (조인)
        private String brandIdNm;          // 브랜드명 (조인)
        private String mdUserNm;           // 담당MD명
        private String promoNm;            // 프로모션명
        private String couponNm;           // 쿠폰명
        private String discntNm;           // 할인명
        private String voucherNm;          // 상품권명
        private String giftNm;             // 사은품명
        // 코드명 (sy_code codeLabel 조인 alias)
        private String rawTypeCdNm;           // 수집유형명
        private String rawStatusCdNm;         // 수집상태명
        private String orderItemStatusCdNm;   // 주문상태명
        private String vendorTypeCdNm;        // 업체구분명
        private String payMethodCdNm;         // 결제수단명
    }

}
