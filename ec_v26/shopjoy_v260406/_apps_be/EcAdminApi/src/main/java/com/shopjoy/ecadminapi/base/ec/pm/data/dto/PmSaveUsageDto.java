package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmSaveUsageDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String saveUsageId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveUsageId;
        private String siteId;
        private String memberId;
        private String orderId;
        private String orderItemId;
        private String prodId;
        private Long useAmt;
        private Long balanceAmt;
        private LocalDateTime usedDate;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
