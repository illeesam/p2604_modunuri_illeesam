package com.shopjoy.ecadminapi.base.ec.st.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "st_settle_raw", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 정산 원천 데이터 엔티티
@Comment("정산 수집원장 (od_order_item / od_claim_item 기반 정산 원천 데이터, 통계·분석 기반 테이블)")
public class StSettleRaw extends BaseEntity {

    @Id
    @Comment("수집원장ID (YYMMDDhhmmss+rand4)")
    @Column(name = "settle_raw_id", length = 21, nullable = false)
    private String settleRawId;

    @Comment("사이트ID")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("수집유형 (코드: RAW_TYPE — ORDER/CLAIM)")
    @Column(name = "raw_type_cd", length = 20, nullable = false)
    private String rawTypeCd;

    @Comment("수집상태 (코드: RAW_STATUS)")
    @Column(name = "raw_status_cd", length = 20)
    private String rawStatusCd;

    @Comment("변경 전 수집상태")
    @Column(name = "raw_status_cd_before", length = 20)
    private String rawStatusCdBefore;

    @Comment("주문ID (od_order.order_id)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("주문번호 스냅샷")
    @Column(name = "order_no", length = 30)
    private String orderNo;

    @Comment("주문상품ID (od_order_item.order_item_id)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Comment("주문일시 스냅샷")
    @Column(name = "order_date")
    private LocalDateTime orderDate;

    @Comment("수집 시점 주문상태 스냅샷 (코드: ORDER_ITEM_STATUS)")
    @Column(name = "order_item_status_cd", length = 20)
    private String orderItemStatusCd;

    @Comment("주문 회원ID 스냅샷 (mb_member.member_id)")
    @Column(name = "member_id", length = 21)
    private String memberId;

    @Comment("클레임ID (클레임 수집 시)")
    @Column(name = "claim_id", length = 21)
    private String claimId;

    @Comment("클레임상품ID (클레임 수집 시)")
    @Column(name = "claim_item_id", length = 21)
    private String claimItemId;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("업체구분 (코드: VENDOR_TYPE — SALE/DLIV/EXTERNAL)")
    @Column(name = "vendor_type_cd", length = 20)
    private String vendorTypeCd;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("상품명 스냅샷")
    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Comment("브랜드ID 스냅샷 (sy_brand.brand_id)")
    @Column(name = "brand_id", length = 21)
    private String brandId;

    @Comment("브랜드명 스냅샷")
    @Column(name = "brand_nm", length = 100)
    private String brandNm;

    @Comment("카테고리 1단계(대분류) ID 스냅샷 (pd_category.category_id)")
    @Column(name = "category_id_1", length = 21)
    private String categoryId1;

    @Comment("카테고리 2단계(중분류) ID 스냅샷 (pd_category.category_id)")
    @Column(name = "category_id_2", length = 21)
    private String categoryId2;

    @Comment("카테고리 3단계(소분류) ID 스냅샷 (pd_category.category_id)")
    @Column(name = "category_id_3", length = 21)
    private String categoryId3;

    @Comment("카테고리 4단계 ID 스냅샷 (pd_category.category_id)")
    @Column(name = "category_id_4", length = 21)
    private String categoryId4;

    @Comment("카테고리 5단계 ID 스냅샷 (pd_category.category_id)")
    @Column(name = "category_id_5", length = 21)
    private String categoryId5;

    @Comment("SKU ID 스냅샷 (pd_prod_sku.sku_id)")
    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Comment("옵션1 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Comment("옵션2 값ID 스냅샷 (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Comment("담당MD (sy_user.user_id)")
    @Column(name = "md_user_id", length = 21)
    private String mdUserId;

    @Comment("정상가 스냅샷 (할인 전 1ea 가격)")
    @Column(name = "normal_price")
    private Long normalPrice;

    @Comment("단가 (옵션 추가금액 포함)")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("주문수량")
    @Column(name = "order_qty")
    private Integer orderQty;

    @Comment("소계 (unit_price × order_qty)")
    @Column(name = "item_price")
    private Long itemPrice;

    @Comment("직접할인금액")
    @Column(name = "discnt_amt")
    private Long discntAmt;

    @Comment("쿠폰할인금액")
    @Column(name = "coupon_discnt_amt")
    private Long couponDiscntAmt;

    @Comment("프로모션할인금액")
    @Column(name = "promo_discnt_amt")
    private Long promoDiscntAmt;

    @Comment("프로모션ID (pm_event.event_id)")
    @Column(name = "promo_id", length = 21)
    private String promoId;

    @Comment("쿠폰ID (pm_coupon.coupon_id)")
    @Column(name = "coupon_id", length = 21)
    private String couponId;

    @Comment("쿠폰발급ID (pm_coupon_issue.coupon_issue_id)")
    @Column(name = "coupon_issue_id", length = 21)
    private String couponIssueId;

    @Comment("할인ID (pm_discnt.discnt_id)")
    @Column(name = "discnt_id", length = 21)
    private String discntId;

    @Comment("상품권ID (pm_voucher.voucher_id)")
    @Column(name = "voucher_id", length = 21)
    private String voucherId;

    @Comment("상품권발급ID (pm_voucher_issue.voucher_issue_id)")
    @Column(name = "voucher_issue_id", length = 21)
    private String voucherIssueId;

    @Comment("상품권 사용금액")
    @Column(name = "voucher_use_amt")
    private Long voucherUseAmt;

    @Comment("캐쉬(적립금) 사용금액")
    @Column(name = "cache_use_amt")
    private Long cacheUseAmt;

    @Comment("마일리지 사용금액")
    @Column(name = "mileage_use_amt")
    private Long mileageUseAmt;

    @Comment("적립 예정금액 (구매확정 전=예상, 확정 후=실적립)")
    @Column(name = "save_schd_amt")
    private Long saveSchdAmt;

    @Comment("사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21)
    private String giftId;

    @Comment("사은품 원가금액 (정산 차감 대상)")
    @Column(name = "gift_amt")
    private Long giftAmt;

    @Comment("결제수단 (코드: PAY_METHOD_CD)")
    @Column(name = "pay_method_cd", length = 20)
    private String payMethodCd;

    @Comment("구매확정여부 Y/N")
    @Column(name = "buy_confirm_yn", length = 1)
    private String buyConfirmYn;

    @Comment("구매확정일시")
    @Column(name = "buy_confirm_date")
    private LocalDateTime buyConfirmDate;

    @Comment("묶음 안분율 (%) — 부분 정산 계산 기준")
    @Column(name = "bundle_price_rate")
    private BigDecimal bundlePriceRate;

    @Comment("정산대상금액 (item_price - 모든 할인)")
    @Column(name = "settle_target_amt")
    private Long settleTargetAmt;

    @Comment("수수료율 (%)")
    @Column(name = "settle_fee_rate")
    private BigDecimal settleFeeRate;

    @Comment("수수료금액")
    @Column(name = "settle_fee_amt")
    private Long settleFeeAmt;

    @Comment("정산금액 (settle_target_amt - settle_fee_amt)")
    @Column(name = "settle_amt")
    private Long settleAmt;

    @Comment("정산기간 (YYYY-MM)")
    @Column(name = "settle_period", length = 7)
    private String settlePeriod;

    @Comment("정산집계ID (st_settle.settle_id, 집계 후 연결)")
    @Column(name = "settle_id", length = 21)
    private String settleId;

    @Comment("정산마감 완료 여부 Y/N")
    @Column(name = "close_yn", length = 1)
    private String closeYn;

    @Comment("마감일시")
    @Column(name = "close_date")
    private LocalDateTime closeDate;

    @Comment("정산마감ID (st_settle_close.settle_close_id)")
    @Column(name = "settle_close_id", length = 21)
    private String settleCloseId;

    @Comment("ERP 전표ID (st_erp_voucher.erp_voucher_id)")
    @Column(name = "erp_voucher_id", length = 21)
    private String erpVoucherId;

    @Comment("ERP 전표 라인번호 (st_erp_voucher_line.line_no)")
    @Column(name = "erp_voucher_line_no")
    private Integer erpVoucherLineNo;

    @Comment("ERP 전송 여부 Y/N")
    @Column(name = "erp_send_yn", length = 1)
    private String erpSendYn;

    @Comment("ERP 전송일시")
    @Column(name = "erp_send_date")
    private LocalDateTime erpSendDate;

}
