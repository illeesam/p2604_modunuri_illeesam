package com.shopjoy.ecBeBo.base.ec.od.data.dto;

import com.shopjoy.ecBeBo.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdClaimItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID 필터
        @Size(max = 21) private String claimItemId;  // 클레임항목ID 필터
        @Size(max = 21) private String claimId;        // 상위 FK 필터
        private List<String> claimIds;                 // 상위 FK 다건 IN
        @Size(max = 50) private String claimItemStatusCd;  // 항목상태 단건 필터 (strEq)
        private List<String> claimItemStatusCds;            // 항목상태 다중 필터 (strIn, BO multiCheck)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String claimItemId;  // 클레임항목ID (YYMMDDhhmmss+rand4)
        private String claimId;  // 클레임ID (od_claim.)
        private String orderItemId;  // 주문상품ID (od_order_item.)
        private String prodId;  // 상품ID
        private String prodNm;  // 상품명 (주문시점 스냅샷)
        private String prodSkuId;  // SKU ID (pd_prod_sku.prod_sku_id, 주문시점 스냅샷)
        private String prodOpt1Id;  // 옵션1 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
        private String prodOpt2Id;  // 옵션2 값ID (pd_prod_opt.prod_opt_id, 주문시점 스냅샷)
        private String prodOption;  // 옵션 (색상/사이즈 스냅샷)
        private String newProdId;  // [교환] 교환 요청 상품ID (claim_type_cd=EXCHANGE 시에만 사용)
        private String newProdSkuId;  // [교환] 교환 요청 SKU ID
        private String newProdOpt1Id;  // [교환] 교환 요청 옵션1 값ID
        private String newProdOpt2Id;  // [교환] 교환 요청 옵션2 값ID
        private String newProdNm;  // [교환] 교환 요청 상품명
        private String newProdOption;  // [교환] 교환 요청 옵션 텍스트
        private Integer newQty;  // [교환] 교환 요청 수량
        private Long newUnitPrice;  // [교환] 교환 요청 단가 (정산 차액 계산용)
        private Long unitPrice;  // 판매가 (단가)
        private Integer claimQty;  // 클레임 수량
        private Long itemAmt;  // 클레임금액 (unit_price × claim_qty)
        private Long refundAmt;  // 환불금액
        private String claimItemStatusCd;  // 항목상태 — CLAIM_ITEM_STATUS_CD {REQUESTED:신청, APPROVED:승인, IN_PICKUP:수거중, PROCESSING:처리중, IN_TRANSIT:교환출고중, COMPLT:완료, REJECTED:거부, CANCELLED:취소}
        private String claimItemStatusCdBefore;  // 변경 전 클레임상태 — CLAIM_ITEM_STATUS_CD
        private Long returnShippingFee;  // 해당 항목의 수거배송료
        private Long inboundShippingFee;  // 해당 항목의 반입배송료
        private Long exchangeShippingFee;  // 해당 항목의 교환 발송배송료
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String siteId;  // 사이트ID
        private String siteNm;  // 사이트명 (조인)
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
        private String updBy;  // 수정자
        private LocalDateTime updDate;  // 수정일
    }

}
