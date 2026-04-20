package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class PmVoucherReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String voucherId;
    private String siteId;
    private String voucherNm;
    private String voucherTypeCd;
    private BigDecimal voucherValue;
    private Long minOrderAmt;
    private Long maxDiscntAmt;
    private Integer expireMonth;
    private String voucherStatusCd;
    private String voucherStatusCdBefore;
    private String voucherDesc;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmVoucher toEntity() {
        return PmVoucher.builder()
                .voucherId(voucherId)
                .siteId(siteId)
                .voucherNm(voucherNm)
                .voucherTypeCd(voucherTypeCd)
                .voucherValue(voucherValue)
                .minOrderAmt(minOrderAmt)
                .maxDiscntAmt(maxDiscntAmt)
                .expireMonth(expireMonth)
                .voucherStatusCd(voucherStatusCd)
                .voucherStatusCdBefore(voucherStatusCdBefore)
                .voucherDesc(voucherDesc)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
