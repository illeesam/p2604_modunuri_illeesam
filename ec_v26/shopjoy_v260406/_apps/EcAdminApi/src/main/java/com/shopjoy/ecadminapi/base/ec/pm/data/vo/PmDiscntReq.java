package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscnt;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmDiscntReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

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

    public PmDiscnt toEntity() {
        return PmDiscnt.builder()
                .discntId(discntId)
                .siteId(siteId)
                .discntNm(discntNm)
                .discntTypeCd(discntTypeCd)
                .discntTargetCd(discntTargetCd)
                .discntValue(discntValue)
                .minOrderAmt(minOrderAmt)
                .minOrderQty(minOrderQty)
                .maxDiscntAmt(maxDiscntAmt)
                .startDate(startDate)
                .endDate(endDate)
                .discntStatusCd(discntStatusCd)
                .discntStatusCdBefore(discntStatusCdBefore)
                .discntDesc(discntDesc)
                .memGradeCd(memGradeCd)
                .selfCdivRate(selfCdivRate)
                .sellerCdivRate(sellerCdivRate)
                .dvcPcYn(dvcPcYn)
                .dvcMwebYn(dvcMwebYn)
                .dvcMappYn(dvcMappYn)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
