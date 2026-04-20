package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveUsage;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmSaveUsageReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String saveUsageId;
    private String siteId;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private Long useAmt;
    private Long balanceAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmSaveUsage toEntity() {
        return PmSaveUsage.builder()
                .saveUsageId(saveUsageId)
                .siteId(siteId)
                .memberId(memberId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .useAmt(useAmt)
                .balanceAmt(balanceAmt)
                .usedDate(usedDate)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
