package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class StErpVoucherDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String erpVoucherId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String erpVoucherId;
        private String siteId;
        private String vendorId;
        private String settleId;
        private String settleYm;
        private String erpVoucherTypeCd;
        private String erpVoucherStatusCd;
        private String erpVoucherStatusCdBefore;
        private LocalDate voucherDate;
        private String erpVoucherDesc;
        private Long totalDebitAmt;
        private Long totalCreditAmt;
        private LocalDateTime erpSendDate;
        private String erpVoucherNo;
        private String erpResMsg;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
