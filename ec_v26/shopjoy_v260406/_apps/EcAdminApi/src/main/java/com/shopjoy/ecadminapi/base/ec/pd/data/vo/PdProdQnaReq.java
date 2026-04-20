package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdQna;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdQnaReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String qnaId;
    private String siteId;
    private String prodId;
    private String skuId;
    private String memberId;
    private String orderId;
    private String qnaTypeCd;
    private String qnaTitle;
    private String qnaContent;
    private String scrtYn;
    private String answYn;
    private String answContent;
    private LocalDateTime answDate;
    private String answUserId;
    private String dispYn;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdQna toEntity() {
        return PdProdQna.builder()
                .qnaId(qnaId)
                .siteId(siteId)
                .prodId(prodId)
                .skuId(skuId)
                .memberId(memberId)
                .orderId(orderId)
                .qnaTypeCd(qnaTypeCd)
                .qnaTitle(qnaTitle)
                .qnaContent(qnaContent)
                .scrtYn(scrtYn)
                .answYn(answYn)
                .answContent(answContent)
                .answDate(answDate)
                .answUserId(answUserId)
                .dispYn(dispYn)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
