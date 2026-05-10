package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StErpVoucherLineDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String erpVoucherLineId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String erpVoucherLineId;
        private String erpVoucherId;
        private Integer lineNo;
        private String accountCd;
        private String accountNm;
        private String costCenterCd;
        private String profitCenterCd;
        private Long debitAmt;
        private Long creditAmt;
        private String refTypeCd;
        private String refId;
        private String lineMemo;
        private String regBy;
        private LocalDateTime regDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
