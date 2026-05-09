package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettleEtcAdjDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String settleEtcAdjId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settleEtcAdjId;
        private String settleId;
        private String siteId;
        private String etcAdjTypeCd;
        private String etcAdjDirCd;
        private Long etcAdjAmt;
        private String etcAdjReason;
        private String settleEtcAdjMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
