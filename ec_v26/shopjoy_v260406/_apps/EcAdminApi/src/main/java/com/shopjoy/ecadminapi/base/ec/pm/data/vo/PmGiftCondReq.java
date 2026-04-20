package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmGiftCond;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmGiftCondReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String giftCondId;
    private String giftId;
    private String siteId;
    private String condTypeCd;
    private Long minOrderAmt;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmGiftCond toEntity() {
        return PmGiftCond.builder()
                .giftCondId(giftCondId)
                .giftId(giftId)
                .siteId(siteId)
                .condTypeCd(condTypeCd)
                .minOrderAmt(minOrderAmt)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
