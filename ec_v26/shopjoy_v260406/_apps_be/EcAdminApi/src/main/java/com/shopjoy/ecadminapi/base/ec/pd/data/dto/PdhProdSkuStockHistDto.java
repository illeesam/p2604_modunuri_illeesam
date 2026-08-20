package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdhProdSkuStockHistDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 21) private String histId;  // 이력ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String histId;  // 이력ID (YYMMDDhhmmss+rand4)
        private String prodSkuId;  // SKU ID (pd_prod_sku.prod_sku_id)
        private String prodId;  // 상품ID (pd_prod.prod_id)
        private Integer stockBefore;  // 변경 전 재고수량
        private Integer stockAfter;  // 변경 후 재고수량
        private Integer chgQty;  // 변동수량 (양수=입고, 음수=출고/판매)
        private String chgReasonCd;  // 변동사유 — CHG_REASON_CD {SALE:판매, PURCHASE:입고, RETURN:반품, EXCHANGE:교환, ADJUST:조정, CLAIM:클레임, ADMIN:관리자조정}
        private String chgReason;  // 변동사유 상세
        private String orderItemId;  // 연관 주문상품ID (od_order_item.order_item_id, SALE/RETURN/EXCHANGE/CLAIM 시)
        private String chgBy;  // 처리자 (sy_user.user_id)
        private LocalDateTime chgDate;  // 처리일시
        private String regBy;  // 등록자
        private LocalDateTime regDate;  // 등록일
        private String regSiteId;  // 등록 사이트ID
        private String regSiteNm;  // 등록사이트명 (조인)
        private String regUserNm;  // 등록자명 (조인)
    }

}
