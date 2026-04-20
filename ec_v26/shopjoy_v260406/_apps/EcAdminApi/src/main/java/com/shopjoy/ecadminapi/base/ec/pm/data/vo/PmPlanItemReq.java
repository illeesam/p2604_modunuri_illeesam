package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmPlanItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmPlanItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String planItemId;
    private String planId;
    private String siteId;
    private String prodId;
    private Integer sortOrd;
    private String planItemMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmPlanItem toEntity() {
        return PmPlanItem.builder()
                .planItemId(planItemId)
                .planId(planId)
                .siteId(siteId)
                .prodId(prodId)
                .sortOrd(sortOrd)
                .planItemMemo(planItemMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
