package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdOptItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdOptItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String optItemId;
    private String siteId;
    private String optId;
    private String optTypeCd;
    private String optNm;
    private String optVal;
    private String optValCodeId;
    private String parentOptItemId;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdOptItem toEntity() {
        return PdProdOptItem.builder()
                .optItemId(optItemId)
                .siteId(siteId)
                .optId(optId)
                .optTypeCd(optTypeCd)
                .optNm(optNm)
                .optVal(optVal)
                .optValCodeId(optValCodeId)
                .parentOptItemId(parentOptItemId)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
