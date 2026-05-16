package com.shopjoy.ecadminapi.base.ec.od.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class OdDlivItemDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String dlivItemId;
        @Size(max = 21) private String dlivId;         // 상위 FK 필터
        private List<String> dlivIds;                  // 상위 FK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivItemId;
        private String siteId;
        private String dlivId;
        private String orderItemId;
        private String prodId;
        private String optItemId1;
        private String optItemId2;
        private String dlivTypeCd;
        private Long unitPrice;
        private Integer dlivQty;
        private String dlivItemStatusCd;
        private String dlivItemStatusCdBefore;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
