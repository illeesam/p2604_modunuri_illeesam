package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleClose;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettleCloseReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleCloseId;
    private String settleId;
    private String siteId;
    private String closeStatusCd;
    private String closeReason;
    private Long finalSettleAmt;
    private String closeBy;
    private LocalDateTime closeDate;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public StSettleClose toEntity() {
        return StSettleClose.builder()
                .settleCloseId(settleCloseId)
                .settleId(settleId)
                .siteId(siteId)
                .closeStatusCd(closeStatusCd)
                .closeReason(closeReason)
                .finalSettleAmt(finalSettleAmt)
                .closeBy(closeBy)
                .closeDate(closeDate)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
