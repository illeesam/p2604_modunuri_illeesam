package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
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
        @Size(max = 21) private String memberId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cartId;
        private String siteId;
        private String memberId;
        private String sessionKey;
        private String prodId;
        private String skuId;
        private String optItemId1;
        private String optItemId2;
        private Long unitPrice;
        private Integer orderQty;
        private Long itemPrice;
        private String isChecked;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
        private String siteNm;
        private String memberNm;
        private String prodNm;
        private String optNm1;
        private String optNm2;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
