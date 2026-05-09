package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettleCloseDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String settleCloseId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleCloseId;
        private String settleId;
        private String siteId;
        private String closeStatusCd;
        private String closeReason;
        private Long finalSettleAmt;
        private String closeBy;
        private LocalDateTime closeDate;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
