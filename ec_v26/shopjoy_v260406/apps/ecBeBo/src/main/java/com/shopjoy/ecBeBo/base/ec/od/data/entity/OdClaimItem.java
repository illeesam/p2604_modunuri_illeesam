package com.shopjoy.ecBeBo.base.ec.od.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "claimItemId 는 21자 이내여야 합니다.")
    private String claimItemId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("클레임ID (od_claim.)")
    @Column(name = "claim_id", length = 21, nullable = false)
    @Size(max = 21, message = "claimId 는 21자 이내여야 합니다.")
    private String claimId;

    @Comment("주문상품ID (od_order_item.)")
    @Column(name = "order_item_id", length = 21, nullable = false)
    @Size(max = 21, message = "orderItemId 는 21자 이내여야 합니다.")
    private String orderItemId;

    @Comment("상품ID")
    @Column(name = "prod_id", length = 21)
    @Size(max = 21, message = "prodId 는 21자 이내여야 합니다.")
    private String prodId;

    @Comment("상품명 (주문시점 스냅샷)")
    @Column(name = "prod_nm", length = 200)
    @Size(max = 200, message = "prodNm 는 200자 이내여야 합니다.")
    private String prodNm;

    @Comment("SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)")
    @Column(name = "prod_sku_id", length = 21)
    @Size(max = 21, message = "prodSkuId 는 21자 이내여야 합니다.")
    private String prodSkuId;

    @Comment("옵션1 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)")
    @Column(name = "prod_opt1_id", length = 21)
    @Size(max = 21, message = "prodOpt1Id 는 21자 이내여야 합니다.")
    private String prodOpt1Id;

    @Comment("옵션2 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)")
    @Column(name = "prod_opt2_id", length = 21)
    @Size(max = 21, message = "prodOpt2Id 는 21자 이내여야 합니다.")
    private String prodOpt2Id;

    @Comment("옵션 (색상/사이즈 스냅샷)")
    @Column(name = "prod_option", length = 500)
    @Size(max = 500, message = "prodOption 는 500자 이내여야 합니다.")
    private String prodOption;

    @Comment("[교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)")
    @Column(name = "new_prod_id", length = 21)
    @Size(max = 21, message = "newProdId 는 21자 이내여야 합니다.")
    private String newProdId;

    @Comment("[교환] 교환 요청 SKU ID")
    @Column(name = "new_prod_sku_id", length = 21)
    @Size(max = 21, message = "newProdSkuId 는 21자 이내여야 합니다.")
    private String newProdSkuId;

    @Comment("[교환] 교환 요청 옵션1 값ID")
    @Column(name = "new_prod_opt1_id", length = 21)
    @Size(max = 21, message = "newProdOpt1Id 는 21자 이내여야 합니다.")
    private String newProdOpt1Id;

    @Comment("[교환] 교환 요청 옵션2 값ID")
    @Column(name = "new_prod_opt2_id", length = 21)
    @Size(max = 21, message = "newProdOpt2Id 는 21자 이내여야 합니다.")
    private String newProdOpt2Id;

    @Comment("[교환] 교환 요청 상품명")
    @Column(name = "new_prod_nm", length = 200)
    @Size(max = 200, message = "newProdNm 는 200자 이내여야 합니다.")
    private String newProdNm;

    @Comment("[교환] 교환 요청 옵션 텍스트")
    @Column(name = "new_prod_option", length = 500)
    @Size(max = 500, message = "newProdOption 는 500자 이내여야 합니다.")
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

    @Comment("항목상태 (코드: CLAIM_ITEM_STATUS_CD)")
    @Column(name = "claim_item_status_cd", length = 20)
    @Size(max = 20, message = "claimItemStatusCd 는 20자 이내여야 합니다.")
    private String claimItemStatusCd;

    @Comment("변경 전 클레임상태 (코드: CLAIM_ITEM_STATUS_CD)")
    @Column(name = "claim_item_status_cd_before", length = 20)
    @Size(max = 20, message = "claimItemStatusCdBefore 는 20자 이내여야 합니다.")
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
