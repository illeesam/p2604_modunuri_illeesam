package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PdProdBundleItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;             // 사이트ID 필터
        @Size(max = 1) private String useYn;                 // 사용여부 필터 Y/N
        @Size(max = 21) private String prodBundleItemId;    // 묶음구성ID 필터
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodBundleItemId;    // 묶음구성ID (YYMMDDhhmmss+rand4)
        private String bundleProdId;        // 묶음상품ID (pd_prod.prod_id, prod_type_cd=BUNDLE)
        private String itemProdId;          // 구성품 상품ID (pd_prod.prod_id) — 독립 판매 상품
        private String itemSkuId;           // 구성품 SKU ID (pd_prod_sku.prod_sku_id, NULL=SKU 미지정)
        private Integer itemQty;            // 구성 수량 (기본 1)
        private BigDecimal priceRate;       // 가격 안분율 (%) — 구성품 합계 100% 필수, 부분클레임 환불 계산 기준
        private Integer sortOrd;            // 노출 정렬 순서
        private String useYn;               // 사용여부 Y/N
        private String regBy;               // 등록자
        private LocalDateTime regDate;      // 등록일
        private String regSiteId;           // 등록 사이트ID
        private String updBy;               // 수정자
        private LocalDateTime updDate;      // 수정일
    }

}
