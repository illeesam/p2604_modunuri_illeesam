package com.shopjoy.ecadminapi.base.ec.pd.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

public class PdProdOptDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String prodOptId;
        @Size(max = 21) private String prodOptTypeId;
        @Size(max = 21) private String prodId;
        private List<String> prodIds;                  // PK 다건 IN
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String prodOptId;
        private String siteId;
        private String prodOptTypeId;
        private String prodId;
        private String prodOptNm;
        private String prodOptVal;
        private String prodOptStdCd;
        private String prodOptTypeLevel1Cd;
        private String prodOptTypeLevel2Cd;
        private String parentProdOptId;
        private String prodOptStyle;
        private Integer sortOrd;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
