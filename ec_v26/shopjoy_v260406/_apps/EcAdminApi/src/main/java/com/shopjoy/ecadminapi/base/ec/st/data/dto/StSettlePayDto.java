package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StSettlePayDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String settlePayId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String settlePayId;
        private String settleId;
        private String siteId;
        private String vendorId;
        private Long payAmt;
        private String payMethodCd;
        private String bankNm;
        private String bankAccount;
        private String bankHolder;
        private String payStatusCd;
        private String payStatusCdBefore;
        private LocalDateTime payDate;
        private String payBy;
        private String settlePayMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
