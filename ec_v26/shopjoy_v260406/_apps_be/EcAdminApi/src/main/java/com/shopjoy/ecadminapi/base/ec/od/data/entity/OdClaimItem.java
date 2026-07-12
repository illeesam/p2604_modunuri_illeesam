package com.shopjoy.ecadminapi.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "od_claim_item", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 클레임 아이템 엔티티
@Comment("클레임 항목 (클레임 대상 주문상품 명세)")
public class OdClaimItem extends BaseEntity {

    @Id
    @Comment("클레임항목ID (YYMMDDhhmmss+rand4)")
    @Column(name = "claim_item_id", length = 21, nullable = false)
    private String claimItemId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("클레임ID (od_claim.)")
    @Column(name = "claim_id", length = 21, nullable = false)
    private String claimId;

    @Comment("주문상품ID (od_order_item.)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    private String orderItemId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21)
    private String prodId;

    @Comment("상품명 (주문시점 스냅샷)")
    @Column(name = "prod_nm", length = 200)
    private String prodNm;

    @Comment("SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)")
    @Column(name = "prod_sku_id", length = 21)
    private String prodSkuId;

    @Comment("옵션1 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)")
    @Column(name = "prod_opt_id_1", length = 21)
    private String prodOptId1;

    @Comment("옵션2 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)")
    @Column(name = "prod_opt_id_2", length = 21)
    private String prodOptId2;

    @Comment("옵션 (색상/사이즈 스냅샷)")
    @Column(name = "prod_option", length = 500)
    private String prodOption;

    @Comment("[교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)")
    @Column(name = "new_prod_id", length = 21)
    private String newProdId;

    @Comment("[교환] 교환 요청 SKU ID")
    @Column(name = "new_prod_sku_id", length = 21)
    private String newProdSkuId;

    @Comment("[교환] 교환 요청 옵션1 값ID")
    @Column(name = "new_prod_opt_id_1", length = 21)
    private String newProdOptId1;

    @Comment("[교환] 교환 요청 옵션2 값ID")
    @Column(name = "new_prod_opt_id_2", length = 21)
    private String newProdOptId2;

    @Comment("[교환] 교환 요청 상품명")
    @Column(name = "new_prod_nm", length = 200)
    private String newProdNm;

    @Comment("[교환] 교환 요청 옵션 텍스트")
    @Column(name = "new_prod_option", length = 500)
    private String newProdOption;

    @Comment("[교환] 교환 요청 수량")
    @Column(name = "new_qty")
    private Integer newQty;

    @Comment("[교환] 교환 요청 단가 (정산 차액 계산: new_unit_price*new_qty - unit_price*claim_qty)")
    @Column(name = "new_unit_price")
    private Long newUnitPrice;

    @Comment("판매가 (단가)")
    @Column(name = "unit_price")
    private Long unitPrice;

    @Comment("클레임 수량")
    @Column(name = "claim_qty")
    private Integer claimQty;

    @Comment("클레임금액 (unit_price × claim_qty)")
    @Column(name = "item_amt")
    private Long itemAmt;

    @Comment("환불금액")
    @Column(name = "refund_amt")
    private Long refundAmt;

    @Comment("항목상태 (코드: CLAIM_ITEM_STATUS)")
    @Column(name = "claim_item_status_cd", length = 20)
    private String claimItemStatusCd;

    @Comment("변경 전 클레임상태 (코드: CLAIM_ITEM_STATUS)")
    @Column(name = "claim_item_status_cd_before", length = 20)
    private String claimItemStatusCdBefore;

    @Comment("해당 항목의 수거배송료")
    @Column(name = "return_shipping_fee")
    private Long returnShippingFee;

    @Comment("해당 항목의 반입배송료")
    @Column(name = "inbound_shipping_fee")
    private Long inboundShippingFee;

    @Comment("해당 항목의 교환 발송배송료")
    @Column(name = "exchange_shipping_fee")
    private Long exchangeShippingFee;

}
