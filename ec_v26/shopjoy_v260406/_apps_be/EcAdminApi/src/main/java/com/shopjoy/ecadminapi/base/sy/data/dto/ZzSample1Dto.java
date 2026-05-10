package com.shopjoy.ecadminapi.base.sy.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ZzSample1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String sample1Id;
        @Size(max = 1) private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sample1Id;
        private String cdGrp;
        private String cdVl;
        private String cdNm;
        private BigDecimal srtordVl;
        private String attrNm1;
        private String attrNm2;
        private String attrNm3;
        private String attrNm4;
        private String explnCn;
        private String cdInfwSeCd;
        private String useYn;
        private String rgtr;
        private LocalDate regDt;
        private String mdfr;
        private LocalDate mdfcnDt;
        private String groupCd;
        private String col01;
        private String col02;
        private String col03;
        private String col04;
        private String col05;
        private String col06;
        private String col07;
        private String col08;
        private String col09;
        private String statusCd;
        private String typeCd;
        private String divCd;
        private String kindCd;
        private String cateCds;
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
