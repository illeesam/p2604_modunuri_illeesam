package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StSettlePay;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StSettlePayReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String settlePayId;
    private String settleId;
    private String siteId;
    private String vendorId;
    private Long payAmt;
    private String payMethodCd;
    private String bankNm;
    private String bankAccount;
    private String bankHolder;
    private String payStatusCd;
    private String payStatusCdBefore;
    private LocalDateTime payDate;
    private String payBy;
    private String settlePayMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StSettlePay toEntity() {
        return StSettlePay.builder()
                .settlePayId(settlePayId)
                .settleId(settleId)
                .siteId(siteId)
                .vendorId(vendorId)
                .payAmt(payAmt)
                .payMethodCd(payMethodCd)
                .bankNm(bankNm)
                .bankAccount(bankAccount)
                .bankHolder(bankHolder)
                .payStatusCd(payStatusCd)
                .payStatusCdBefore(payStatusCdBefore)
                .payDate(payDate)
                .payBy(payBy)
                .settlePayMemo(settlePayMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
