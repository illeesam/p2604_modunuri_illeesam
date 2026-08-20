package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdProdSetItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;  // 사이트ID (검색 필터)
        @Size(max = 1) private String useYn;  // 사용여부 필터 Y/N
        @Size(max = 21) private String prodSetItemId;  // 세트구성ID (단건 조회 필터)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodSetItemId;  // 세트구성ID (YYMMDDhhmmss+rand4)
        private String setProdId;  // 세트상품ID (pd_prod.prod_id, prod_type_cd=SET)
        private String itemProdId;  // 구성품 상품ID (pd_prod.prod_id, NULL=비상품 구성품)
        private String itemSkuId;  // 구성품 SKU ID (pd_prod_sku.prod_sku_id, NULL=SKU 미지정)
        private String itemNm;  // 구성품 표시명 (예: 머그컵, 접시 2p)
        private Integer itemQty;  // 구성 수량
        private String itemDesc;  // 구성품 부가 설명 (소재·용량·색상 등)
        private Integer sortOrd;  // 노출 정렬 순서
        private String useYn;  // 사용여부 Y/N
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
