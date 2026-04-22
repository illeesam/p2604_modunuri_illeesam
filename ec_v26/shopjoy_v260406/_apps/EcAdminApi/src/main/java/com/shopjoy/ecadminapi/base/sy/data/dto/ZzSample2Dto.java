package com.shopjoy.ecadminapi.base.sy.data.dto;

import java.time.LocalDate;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class ZzSample2Dto {
    private String sample2Id;
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
