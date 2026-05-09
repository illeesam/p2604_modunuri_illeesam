package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PmVoucherIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String voucherIssueId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String voucherIssueId;
        private String voucherId;
        private String siteId;
        private String memberId;
        private String voucherCode;
        private LocalDateTime issueDate;
        private LocalDateTime expireDate;
        private LocalDateTime useDate;
        private String orderId;
        private Long useAmt;
        private String voucherIssueStatusCd;
        private String voucherIssueStatusCdBefore;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
