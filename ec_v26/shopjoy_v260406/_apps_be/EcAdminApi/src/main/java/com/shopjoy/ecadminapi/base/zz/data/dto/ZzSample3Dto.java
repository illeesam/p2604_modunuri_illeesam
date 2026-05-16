package com.shopjoy.ecadminapi.base.zz.data.dto;

import com.shopjoy.ecadminapi.common.data.BasePageResponse;
import com.shopjoy.ecadminapi.common.data.BaseRequest;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ZzSample3Dto {

    @Getter @Setter @NoArgsConstructor
    public static class Request extends BaseRequest {
        private List<String> sample1Ids;                 // PK 다건 IN
        private List<String> sample2Ids;                 // PK 다건 IN
        @Size(max = 20) private String sample3Id;
        @Size(max = 21) private String sample1Id;   // 상위 FK 필터
        @Size(max = 21) private String sample2Id;   // 상위 FK 필터
        @Size(max = 1)  private String useYn;
    }

    @Getter @Setter @NoArgsConstructor
    public static class Item {
        private String sample3Id;
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
        private String regBy;
        private LocalDateTime regDate;
        private String updBy;
        private LocalDateTime updDate;
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
        private String sample1Id;            // 상위 FK
        private String sample2Id;            // 상위 FK
        // ── 연관정보 (getById 시 채움) ──
        private ZzSample1Dto.Item sample1;   // 상위 sample1 단건 (sample1_id)
        private ZzSample2Dto.Item sample2;   // 상위 sample2 단건 (sample2_id)
    }

    @Getter @Setter @NoArgsConstructor
    public static class PageResponse extends BasePageResponse<Item, Request> {}
}
