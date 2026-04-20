package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdContent;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdContentReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String prodContentId;
    private String siteId;
    private String prodId;
    private String contentTypeCd;
    private String contentHtml;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdContent toEntity() {
        return PdProdContent.builder()
                .prodContentId(prodContentId)
                .siteId(siteId)
                .prodId(prodId)
                .contentTypeCd(contentTypeCd)
                .contentHtml(contentHtml)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
