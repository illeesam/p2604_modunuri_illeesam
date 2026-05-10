package com.shopjoy.ecadminapi.base.ec.pm.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PmDiscntDto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String siteId;
        @Size(max = 1) private String useYn;
        @Size(max = 21) private String discntId;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String discntId;
        private String siteId;
        private String discntNm;
        private String discntTypeCd;
        private String discntTargetCd;
        private BigDecimal discntValue;
        private Long minOrderAmt;
        private Integer minOrderQty;
        private Long maxDiscntAmt;
        private LocalDateTime startDate;
        private LocalDateTime endDate;
        private String discntStatusCd;
        private String discntStatusCdBefore;
        private String discntDesc;
        private String memGradeCd;
        private BigDecimal selfCdivRate;
        private BigDecimal sellerCdivRate;
        private String dvcPcYn;
        private String dvcMwebYn;
        private String dvcMappYn;
        private String useYn;
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
