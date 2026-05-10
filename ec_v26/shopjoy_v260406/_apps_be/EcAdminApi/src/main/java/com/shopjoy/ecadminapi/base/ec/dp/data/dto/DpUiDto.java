package com.shopjoy.ecadminapi.base.ec.dp.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class DpUiDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 21) private String pathId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String uiId;
        @Size(max = 30) private String deviceTypeCd;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String uiId;
        private String siteId;
        private String uiCd;
        private String uiNm;
        private String uiDesc;
        private String deviceTypeCd;
        private String pathId;
        private Integer sortOrd;
        private String useYn;
        private LocalDate useStartDate;
        private LocalDate useEndDate;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
