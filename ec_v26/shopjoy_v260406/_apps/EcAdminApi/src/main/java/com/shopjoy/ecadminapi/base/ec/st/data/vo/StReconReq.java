package com.shopjoy.ecadminapi.base.ec.st.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.st.data.entity.StRecon;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class StReconReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String reconId;
    private String siteId;
    private String vendorId;
    private String reconTypeCd;
    private String reconStatusCd;
    private String reconStatusCdBefore;
    private String settleId;
    private String settleRawId;
    private String refId;
    private String refNo;
    private String settlePeriod;
    private Long expectedAmt;
    private Long actualAmt;
    private Long diffAmt;
    private String reconNote;
    private String resolvedBy;
    private LocalDateTime resolvedDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public StRecon toEntity() {
        return StRecon.builder()
                .reconId(reconId)
                .siteId(siteId)
                .vendorId(vendorId)
                .reconTypeCd(reconTypeCd)
                .reconStatusCd(reconStatusCd)
                .reconStatusCdBefore(reconStatusCdBefore)
                .settleId(settleId)
                .settleRawId(settleRawId)
                .refId(refId)
                .refNo(refNo)
                .settlePeriod(settlePeriod)
                .expectedAmt(expectedAmt)
                .actualAmt(actualAmt)
                .diffAmt(diffAmt)
                .reconNote(reconNote)
                .resolvedBy(resolvedBy)
                .resolvedDate(resolvedDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
