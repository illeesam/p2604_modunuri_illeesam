package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdRestockNoti;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdRestockNotiReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String restockNotiId;
    private String siteId;
    private String prodId;
    private String skuId;
    private String memberId;
    private String notiYn;
    private LocalDateTime notiDate;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdRestockNoti toEntity() {
        return PdRestockNoti.builder()
                .restockNotiId(restockNotiId)
                .siteId(siteId)
                .prodId(prodId)
                .skuId(skuId)
                .memberId(memberId)
                .notiYn(notiYn)
                .notiDate(notiDate)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
