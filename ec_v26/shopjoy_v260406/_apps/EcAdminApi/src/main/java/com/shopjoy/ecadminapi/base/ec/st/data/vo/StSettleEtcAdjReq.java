package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleEtcAdj;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleEtcAdjReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleEtcAdjId;
    private String settleId;
    private String siteId;
    private String etcAdjTypeCd;
    private String etcAdjDirCd;
    private Long etcAdjAmt;
    private String etcAdjReason;
    private String settleEtcAdjMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StSettleEtcAdj toEntity() {
        return StSettleEtcAdj.builder()
                .settleEtcAdjId(settleEtcAdjId)
                .settleId(settleId)
                .siteId(siteId)
                .etcAdjTypeCd(etcAdjTypeCd)
                .etcAdjDirCd(etcAdjDirCd)
                .etcAdjAmt(etcAdjAmt)
                .etcAdjReason(etcAdjReason)
                .settleEtcAdjMemo(settleEtcAdjMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
