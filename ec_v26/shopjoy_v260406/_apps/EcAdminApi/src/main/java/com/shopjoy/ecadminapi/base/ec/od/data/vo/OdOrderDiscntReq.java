package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderDiscnt;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class OdOrderDiscntReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String orderDiscntId;
    private String siteId;
    private String orderId;
    private String discntTypeCd;
    private String couponId;
    private String couponIssueId;
    private BigDecimal discntRate;
    private Long discntAmt;
    private Long baseItemAmt;
    private String restoreYn;
    private Long restoreAmt;
    private LocalDateTime restoreDate;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public OdOrderDiscnt toEntity() {
        return OdOrderDiscnt.builder()
                .orderDiscntId(orderDiscntId)
                .siteId(siteId)
                .orderId(orderId)
                .discntTypeCd(discntTypeCd)
                .couponId(couponId)
                .couponIssueId(couponIssueId)
                .discntRate(discntRate)
                .discntAmt(discntAmt)
                .baseItemAmt(baseItemAmt)
                .restoreYn(restoreYn)
                .restoreAmt(restoreAmt)
                .restoreDate(restoreDate)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
