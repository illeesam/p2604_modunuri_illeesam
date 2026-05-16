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

public class ZzSamy2Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> samy1Ids;                 // PK 다건 IN
        private List<String> samy2Ids;                 // PK 다건 IN
        @Size(max = 21) private String samy2Id;
        @Size(max = 21) private String samy1Id;   // 상위 FK 필터
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String samy2Id;
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
        private String samy1Id;

        // ── 상위 계층 연관정보 ──
        private ZzSamy1Dto.Item samy1;   // 상위 samy1 단건 (samy1_id)

        // ── 하위 계층 연관정보 ──
        private List<ZzSamy3Dto.Item> samy3s;   // 하위 samy3 목록 (samy2_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
