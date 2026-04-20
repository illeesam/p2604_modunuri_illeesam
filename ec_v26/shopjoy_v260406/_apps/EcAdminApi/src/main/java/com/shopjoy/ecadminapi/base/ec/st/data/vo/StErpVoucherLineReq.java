package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StErpVoucherLine;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StErpVoucherLineReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String erpVoucherLineId;
    private String erpVoucherId;
    private Integer lineNo;
    private String accountCd;
    private String accountNm;
    private String costCenterCd;
    private String profitCenterCd;
    private Long debitAmt;
    private Long creditAmt;
    private String refTypeCd;
    private String refId;
    private String lineMemo;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public StErpVoucherLine toEntity() {
        return StErpVoucherLine.builder()
                .erpVoucherLineId(erpVoucherLineId)
                .erpVoucherId(erpVoucherId)
                .lineNo(lineNo)
                .accountCd(accountCd)
                .accountNm(accountNm)
                .costCenterCd(costCenterCd)
                .profitCenterCd(profitCenterCd)
                .debitAmt(debitAmt)
                .creditAmt(creditAmt)
                .refTypeCd(refTypeCd)
                .refId(refId)
                .lineMemo(lineMemo)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
