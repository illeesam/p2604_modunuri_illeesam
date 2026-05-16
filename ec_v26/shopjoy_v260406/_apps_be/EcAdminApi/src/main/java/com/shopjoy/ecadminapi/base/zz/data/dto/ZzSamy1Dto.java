package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ZzSamy1Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        @Size(max = 21) private String samy1Id;
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String samy1Id;
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
        // ── 하위 계층 연관정보 ──
        private List<ZzSamy2Dto.Item> samy2s;   // 하위 samy2 목록 (samy1_id)
        private List<ZzSamy3Dto.Item> samy3s;   // 하위 samy3 목록 (samy1_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
