package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmSaveReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String saveId;
    private String siteId;
    private String memberId;
    private String saveTypeCd;
    private Long saveAmt;
    private Long balanceAmt;
    private String refTypeCd;
    private String refId;
    private LocalDateTime expireDate;
    private String saveMemo;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmSave toEntity() {
        return PmSave.builder()
                .saveId(saveId)
                .siteId(siteId)
                .memberId(memberId)
                .saveTypeCd(saveTypeCd)
                .saveAmt(saveAmt)
                .balanceAmt(balanceAmt)
                .refTypeCd(refTypeCd)
                .refId(refId)
                .expireDate(expireDate)
                .saveMemo(saveMemo)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
