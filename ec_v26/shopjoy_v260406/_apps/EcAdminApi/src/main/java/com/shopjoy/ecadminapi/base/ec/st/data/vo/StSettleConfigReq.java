package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettleConfig;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class StSettleConfigReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settleConfigId;
    private String siteId;
    private String vendorId;
    private String categoryId;
    private String settleCycleCd;
    private Integer settleDay;
    private BigDecimal commissionRate;
    private Long minSettleAmt;
    private String settleConfigRemark;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StSettleConfig toEntity() {
        return StSettleConfig.builder()
                .settleConfigId(settleConfigId)
                .siteId(siteId)
                .vendorId(vendorId)
                .categoryId(categoryId)
                .settleCycleCd(settleCycleCd)
                .settleDay(settleDay)
                .commissionRate(commissionRate)
                .minSettleAmt(minSettleAmt)
                .settleConfigRemark(settleConfigRemark)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
