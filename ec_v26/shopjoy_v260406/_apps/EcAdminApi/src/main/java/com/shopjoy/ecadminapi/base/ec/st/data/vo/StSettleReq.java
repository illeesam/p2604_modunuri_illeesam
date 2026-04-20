package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettle;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleId;
    private String siteId;
    private String vendorId;
    private String settleYm;
    private LocalDateTime settleStartDate;
    private LocalDateTime settleEndDate;
    private Long totalOrderAmt;
    private Long totalReturnAmt;
    private Integer totalClaimCnt;
    private Long totalDiscntAmt;
    private BigDecimal commissionRate;
    private Long commissionAmt;
    private Long settleAmt;
    private Long adjAmt;
    private Long etcAdjAmt;
    private Long finalSettleAmt;
    private String settleStatusCd;
    private String settleStatusCdBefore;
    private String settleMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StSettle toEntity() {
        return StSettle.builder()
                .settleId(settleId)
                .siteId(siteId)
                .vendorId(vendorId)
                .settleYm(settleYm)
                .settleStartDate(settleStartDate)
                .settleEndDate(settleEndDate)
                .totalOrderAmt(totalOrderAmt)
                .totalReturnAmt(totalReturnAmt)
                .totalClaimCnt(totalClaimCnt)
                .totalDiscntAmt(totalDiscntAmt)
                .commissionRate(commissionRate)
                .commissionAmt(commissionAmt)
                .settleAmt(settleAmt)
                .adjAmt(adjAmt)
                .etcAdjAmt(etcAdjAmt)
                .finalSettleAmt(finalSettleAmt)
                .settleStatusCd(settleStatusCd)
                .settleStatusCdBefore(settleStatusCdBefore)
                .settleMemo(settleMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
