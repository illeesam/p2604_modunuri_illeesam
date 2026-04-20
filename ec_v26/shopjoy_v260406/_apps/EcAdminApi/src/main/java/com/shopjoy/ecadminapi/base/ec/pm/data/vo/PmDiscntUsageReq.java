package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntUsage;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmDiscntUsageReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String discntUsageId;
    private String siteId;
    private String discntId;
    private String discntNm;
    private String memberId;
    private String orderId;
    private String orderItemId;
    private String prodId;
    private String discntTypeCd;
    private BigDecimal discntValue;
    private Long discntAmt;
    private LocalDateTime usedDate;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmDiscntUsage toEntity() {
        return PmDiscntUsage.builder()
                .discntUsageId(discntUsageId)
                .siteId(siteId)
                .discntId(discntId)
                .discntNm(discntNm)
                .memberId(memberId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .prodId(prodId)
                .discntTypeCd(discntTypeCd)
                .discntValue(discntValue)
                .discntAmt(discntAmt)
                .usedDate(usedDate)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
