package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdDto;
import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdProdSkuDto;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class OdCartDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String cartId;
        @Size(max = 21)  private String memberId;
        @Size(max = 200) private String memberNm;  // 회원명 LIKE 필터 (직접 입력 시)
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cartId;
        private String memberId;
        private String sessionKey;
        private String prodId;
        private String prodSkuId;
        private String prodOpt1Id;
        private String prodOpt2Id;
        private Long unitPrice;
        private Integer orderQty;
        private Long itemPrice;
        private String isChecked;
        private String regBy;
        private LocalDateTime regDate;
        private String regSiteId;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String memberNm;
        private String prodNm;
        private String prodOptNm1;
        private String prodOptNm2;
        // ── 연관정보 (목록 시 채움) ──
        private PdProdDto.Item    prod;   // 상품 단건
        private PdProdSkuDto.Item sku;    // SKU 단건
    }

}
