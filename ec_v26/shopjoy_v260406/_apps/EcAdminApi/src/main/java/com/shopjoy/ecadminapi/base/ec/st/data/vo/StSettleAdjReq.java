package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleAdj;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleAdjReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleAdjId;
    private String settleId;
    private String siteId;
    private String adjTypeCd;
    private Long adjAmt;
    private String adjReason;
    private String settleAdjMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StSettleAdj toEntity() {
        return StSettleAdj.builder()
                .settleAdjId(settleAdjId)
                .settleId(settleId)
                .siteId(siteId)
                .adjTypeCd(adjTypeCd)
                .adjAmt(adjAmt)
                .adjReason(adjReason)
                .settleAdjMemo(settleAdjMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
