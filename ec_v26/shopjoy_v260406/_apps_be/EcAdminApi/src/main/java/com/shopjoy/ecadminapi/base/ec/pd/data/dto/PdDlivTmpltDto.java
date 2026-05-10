package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

public class PdDlivTmpltDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String dlivTmpltId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String dlivTmpltId;
        private String siteId;
        private String vendorId;
        private String dlivTmpltNm;
        private String dlivMethodCd;
        private String dlivPayTypeCd;
        private String dlivCourierCd;
        private Long dlivCost;
        private Long freeDlivMinAmt;
        private Long islandExtraCost;
        private Long returnCost;
        private Long exchangeCost;
        private String returnCourierCd;
        private String returnAddrZip;
        private String returnAddr;
        private String returnAddrDetail;
        private String returnTelNo;
        private String baseDlivYn;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
