package com.shopjoy.ecadminapi.base.ec.st.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class StReconDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String reconId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String reconId;
        private String siteId;
        private String vendorId;
        private String reconTypeCd;
        private String reconStatusCd;
        private String reconStatusCdBefore;
        private String settleId;
        private String settleRawId;
        private String refId;
        private String refNo;
        private String settlePeriod;
        private Long expectedAmt;
        private Long actualAmt;
        private Long diffAmt;
        private String reconNote;
        private String resolvedBy;
        private LocalDateTime resolvedDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
