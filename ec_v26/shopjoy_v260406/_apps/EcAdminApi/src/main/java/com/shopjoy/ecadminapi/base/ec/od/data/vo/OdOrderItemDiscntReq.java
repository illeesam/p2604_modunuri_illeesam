package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdOrderItemDiscnt;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class OdOrderItemDiscntReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String itemDiscntId;
    private String siteId;
    private String orderId;
    private String orderItemId;
    private String discntTypeCd;
    private String couponId;
    private String couponIssueId;
    private BigDecimal discntRate;
    private Long unitDiscntAmt;
    private Long totalDiscntAmt;
    private Integer orderQty;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public OdOrderItemDiscnt toEntity() {
        return OdOrderItemDiscnt.builder()
                .itemDiscntId(itemDiscntId)
                .siteId(siteId)
                .orderId(orderId)
                .orderItemId(orderItemId)
                .discntTypeCd(discntTypeCd)
                .couponId(couponId)
                .couponIssueId(couponIssueId)
                .discntRate(discntRate)
                .unitDiscntAmt(unitDiscntAmt)
                .totalDiscntAmt(totalDiscntAmt)
                .orderQty(orderQty)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
