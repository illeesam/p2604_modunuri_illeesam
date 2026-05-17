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
    private String orderItemId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("주문ID (od_order.)")
    @Column(name = "order_id", length = 21, nullable = false)
    private String orderId;

    @Comment("상품ID (pd_prod.)")
    @Column(name = "prod_id", length = 21, nullable = false)
    private String prodId;

    @Comment("SKU ID (pd_prod_sku., 무옵션 시 NULL)")
    @Column(name = "sku_id", length = 21)
    private String skuId;

    @Comment("옵션1 값ID (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_1", length = 21)
    private String optItemId1;

    @Comment("옵션2 값ID (pd_prod_opt_item.opt_item_id)")
    @Column(name = "opt_item_id_2", length = 21)
    private String optItemId2;

    @Comment("상품명 (주문 시점 스냅샷)")
    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Comment("브랜드명 (주문 시점 스냅샷)")
    @Column(name = "brand_nm", length = 100)
    private String brandNm;

    @Comment("배송비 템플릿ID 스냅샷")
    @Column(name = "dliv_tmplt_id", length = 21)
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

    @Comment("품목 주문 상태 (코드: ORDER_ITEM_STATUS — ORDERED/PAID/PREPARING/SHIPPING/DELIVERED/CONFIRMED/CANCELLED)")
    @Column(name = "order_item_status_cd", length = 20)
    private String orderItemStatusCd;

    @Comment("변경 전 품목상태 (코드: ORDER_ITEM_STATUS)")
    @Column(name = "order_item_status_cd_before", length = 20)
    private String orderItemStatusCdBefore;

    @Comment("클레임 진행 중 여부 Y/N")
    @Column(name = "claim_yn", length = 1)
    private String claimYn;

    @Comment("구매확정여부 Y/N")
    @Column(name = "buy_confirm_yn", length = 1)
    private String buyConfirmYn;

    @Comment("구매확정 예정일 (배송완료 + N일 자동 설정)")
    @Column(name = "buy_confirm_schd_date")
    private LocalDate buyConfirmSchdDate;

    @Comment("구매확정일시")
    @Column(name = "buy_confirm_date")
    private LocalDateTime buyConfirmDate;

    @Comment("정산처리여부 Y/N")
    @Column(name = "settle_yn", length = 1)
    private String settleYn;

    @Comment("정산처리일시")
    @Column(name = "settle_date")
    private LocalDateTime settleDate;

    @Comment("예약판매여부 Y/N")
    @Column(name = "reserve_sale_yn", length = 1)
    private String reserveSaleYn;

    @Comment("예약판매 발송 예정일시")
    @Column(name = "reserve_dliv_schd_date")
    private LocalDateTime reserveDlivSchdDate;

    @Comment("묶음 그룹키 (동일 묶음 구성품 식별, UUID, 일반상품=NULL)")
    @Column(name = "bundle_group_id", length = 36)
    private String bundleGroupId;

    @Comment("묶음 가격 안분율 (%) — 부분클레임 환불 계산 기준")
    @Column(name = "bundle_price_rate")
    private BigDecimal bundlePriceRate;

    @Comment("발급 사은품ID (pm_gift.gift_id)")
    @Column(name = "gift_id", length = 21)
    private String giftId;

    @Comment("해당 항목의 배송료 (부분배송 시)")
    @Column(name = "outbound_shipping_fee")
    private Long outboundShippingFee;

    @Comment("해당 항목의 배송 택배사 (코드: COURIER)")
    @Column(name = "dliv_courier_cd", length = 30)
    private String dlivCourierCd;

    @Comment("해당 항목의 배송 송장번호")
    @Column(name = "dliv_tracking_no", length = 100)
    private String dlivTrackingNo;

    @Comment("해당 항목의 출고일시")
    @Column(name = "dliv_ship_date")
    private LocalDateTime dlivShipDate;

}
