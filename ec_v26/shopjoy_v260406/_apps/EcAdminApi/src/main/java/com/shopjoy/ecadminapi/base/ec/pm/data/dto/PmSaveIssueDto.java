package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmSaveIssueDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String saveIssueId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String saveIssueId;
        private String siteId;
        private String memberId;
        private String saveIssueTypeCd;
        private Long saveAmt;
        private BigDecimal saveRate;
        private String refTypeCd;
        private String refId;
        private String orderId;
        private String orderItemId;
        private String prodId;
        private LocalDateTime expireDate;
        private String issueStatusCd;
        private String issueStatusCdBefore;
        private String saveMemo;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
