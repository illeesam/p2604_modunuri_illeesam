package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdRel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdRelReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String prodRelId;
    private String prodId;
    private String relProdId;
    private String prodRelTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdRel toEntity() {
        return PdProdRel.builder()
                .prodRelId(prodRelId)
                .prodId(prodId)
                .relProdId(relProdId)
                .prodRelTypeCd(prodRelTypeCd)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
