package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "od_order_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 주문 아이템(상품) 엔티티
@Comment("주문상품")
public class OdOrderItem extends BaseEntity {

    @Id
    @Comment("주문상품ID (YYMMDDhhmmss+rand4)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;


    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderId 는 21자 이내여야 합니다.")
    private String orderId;

    @Comment("상품ID (pd_prod.)")
    @Column(name = "prod_id", length = 21, nullable = false)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("SKU ID (pd_prod_sku.prod_sku_id, 무옵션 시 NULL)")
    @Column(name = "prod_sku_id", length = 21)
    @Size(max = 21, message = "prodSkuId 는 21자 이내여야 합니다.")
    private String prodSkuId;

    @Comment("옵션1 값ID (pd_prod_opt.opt_id)")
    @Column(name = "prod_opt1_id", length = 21)
    @Size(max = 21, message = "prodOpt1Id 는 21자 이내여야 합니다.")
    private String prodOpt1Id;

    @Comment("옵션2 값ID (pd_prod_opt.opt_id)")
    @Column(name = "prod_opt2_id", length = 21)
    @Size(max = 21, message = "prodOpt2Id 는 21자 이내여야 합니다.")
    private String prodOpt2Id;

    @Comment("상품명 (주문 시점 스냅샷)")
    @Column(name = "prod_nm", length = 200)
    @Size(max = 100, message = "prodNm 는 100자 이내여야 합니다.")
    private String prodNm;

    @Comment("브랜드명 (주문 시점 스냅샷)")
    @Column(name = "brand_nm", length = 100)
    @Size(max = 100, message = "brandNm 는 100자 이내여야 합니다.")
    private String brandNm;

    @Comment("배송비 템플릿ID 스냅샷")
    @Column(name = "dliv_tmplt_id", length = 21)
    @Size(max = 21, message = "dlivTmpltId 는 21자 이내여야 합니다.")
    private String dlivTmpltId;

    @Comment("정상가 (할인 전 1ea 가격)")
    @Column(name = "normal_price")
    private Long normalPrice;

    @Comment("판매가 (단가, 옵션 추가금액 포함)")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("주문수량")
    @Column(name = "order_qty")
    private Integer orderQty;

    @Comment("주문금액 (unit_price × order_qty)")
    @Column(name = "item_order_amt")
    private Long itemOrderAmt;

    @Comment("취소수량")
    @Column(name = "cancel_qty")
    private Integer cancelQty;

    @Comment("취소금액 (클레임 누적 취소액)")
    @Column(name = "item_cancel_amt")
    private Long itemCancelAmt;

    @Comment("판매완료수량")
    @Column(name = "complet_qty")
    private Integer completQty;

    @Comment("완료금액 (item_order_amt - item_cancel_amt)")
    @Column(name = "item_completed_amt")
    private Long itemCompletedAmt;

    @Comment("원 단가 (주문 확정 시점 스냅샷)")
    @Column(name = "org_unit_price")
    private Long orgUnitPrice;

    @Comment("원 주문금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_item_order_amt")
    private Long orgItemOrderAmt;

    @Comment("원 할인금액 (주문 확정 시점 스냅샷)")
    @Column(name = "org_discount_amt")
    private Long orgDiscountAmt;

    @Comment("원 배송료 (주문 확정 시점 스냅샷)")
    @Column(name = "org_shipping_fee")
    private Long orgShippingFee;

    @Comment("주문 시점 적립율 (%)")
    @Column(name = "save_rate")
    private BigDecimal saveRate;

    @Comment("사용 적립금 (주문상품별 안분금액)")
    @Column(name = "save_use_amt")
    private Long saveUseAmt;

    @Comment("적립 예정금액 (구매확정 전=예상, 확정 후=실적립)")
    @Column(name = "save_schd_amt")
    private Long saveSchdAmt;

    @Comment("품목 주문 상태 (코드: ORDER_ITEM_STATUS_CD — ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED)")
    @Column(name = "order_item_status_cd", length = 20)
    @Size(max = 20, message = "orderItemStatusCd 는 20자 이내여야 합니다.")
    private String orderItemStatusCd;

    @Comment("변경 전 품목상태 (코드: ORDER_ITEM_STATUS_CD)")
    @Column(name = "order_item_status_cd_before", length = 20)
    @Size(max = 20, message = "orderItemStatusCdBefore 는 20자 이내여야 합니다.")
    private String orderItemStatusCdBefore;

    @Comment("클레임 진행 중 여부 Y/N")
    @Column(name = "claim_yn", length = 1)
    @Size(max = 1, message = "claimYn 는 1자 이내여야 합니다.")
    private String claimYn;

    @Comment("구매확정여부 Y/N")
    @Column(name = "buy_confirm_yn", length = 1)
    @Size(max = 1, message = "buyConfirmYn 는 1자 이내여야 합니다.")
    private String buyConfirmYn;

    @Comment("구매확정 예정일 (배송완료 + N일 자동 설정)")
    @Column(name = "buy_confirm_schd_date")
    private LocalDate buyConfirmSchdDate;

    @Comment("구매확정일시")
    @Column(name = "buy_confirm_date")
    private LocalDateTime buyConfirmDate;

    @Comment("정산처리여부 Y/N")
    @Column(name = "settle_yn", length = 1)
    @Size(max = 1, message = "settleYn 는 1자 이내여야 합니다.")
    private String settleYn;

    @Comment("정산처리일시")
    @Column(name = "settle_date")
    private LocalDateTime settleDate;

    @Comment("예약판매여부 Y/N")
    @Column(name = "reserve_sale_yn", length = 1)
    @Size(max = 1, message = "reserveSaleYn 는 1자 이내여야 합니다.")
    private String reserveSaleYn;

    @Comment("예약판매 발송 예정일시")
    @Column(name = "reserve_dliv_schd_date")
    private LocalDateTime reserveDlivSchdDate;

    @Comment("묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)")
    @Column(name = "bundle_group_id", length = 36)
    @Size(max = 36, message = "bundleGroupId 는 36자 이내여야 합니다.")
    private String bundleGroupId;

    @Comment("묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준")
    @Column(name = "bundle_price_rate")
    private BigDecimal bundlePriceRate;

    @Comment("발급 사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21)
    @Size(max = 21, message = "giftId 는 21자 이내여야 합니다.")
    private String giftId;

    @Comment("해당 항목의 배송료 (부분배송 시)")
    @Column(name = "outbound_shipping_fee")
    private Long outboundShippingFee;

    @Comment("해당 항목의 배송 택배사 (코드: COURIER)")
    @Column(name = "dliv_courier_cd", length = 30)
    @Size(max = 30, message = "dlivCourierCd 는 30자 이내여야 합니다.")
    private String dlivCourierCd;

    @Comment("배송방법 override (코드: DLIV_METHOD_CD) - 긴급 발송 등 개별 주문항목 단위 변경. NULL이면 상품 기본값 사용")
    @Column(name = "dliv_method_cd", length = 30)
    @Size(max = 30, message = "dlivMethodCd 는 30자 이내여야 합니다.")
    private String dlivMethodCd;

    @Comment("해당 항목의 배송 송장번호")
    @Column(name = "dliv_tracking_no", length = 100)
    @Size(max = 100, message = "dlivTrackingNo 는 100자 이내여야 합니다.")
    private String dlivTrackingNo;

    @Comment("해당 항목의 출고일시")
    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

}
