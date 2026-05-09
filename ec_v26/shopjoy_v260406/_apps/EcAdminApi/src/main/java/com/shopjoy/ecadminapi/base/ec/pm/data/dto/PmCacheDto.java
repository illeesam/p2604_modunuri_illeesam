package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PmCacheDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String cacheId;
        @Size(max = 21) private String memberId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String cacheId;
        private String siteId;
        private String memberId;
        private String memberNm;
        private String cacheTypeCd;
        private Long cacheAmt;
        private Long balanceAmt;
        private String refId;
        private String cacheDesc;
        private String procUserId;
        private LocalDateTime cacheDate;
        private LocalDate expireDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
