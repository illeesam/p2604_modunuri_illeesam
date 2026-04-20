package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdTag;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdTagReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String prodTagId;
    private String siteId;
    private String prodId;
    private String tagId;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PdProdTag toEntity() {
        return PdProdTag.builder()
                .prodTagId(prodTagId)
                .siteId(siteId)
                .prodId(prodId)
                .tagId(tagId)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
