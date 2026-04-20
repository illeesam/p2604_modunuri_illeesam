package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOpt;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdOptReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String optId;
    private String siteId;
    private String prodId;
    private String optGrpNm;
    private Integer optLevel;
    private String optTypeCd;
    private String optInputTypeCd;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdOpt toEntity() {
        return PdProdOpt.builder()
                .optId(optId)
                .siteId(siteId)
                .prodId(prodId)
                .optGrpNm(optGrpNm)
                .optLevel(optLevel)
                .optTypeCd(optTypeCd)
                .optInputTypeCd(optInputTypeCd)
                .sortOrd(sortOrd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
