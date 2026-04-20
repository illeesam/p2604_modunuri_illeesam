package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCouponItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmCouponItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String couponItemId;
    private String couponId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmCouponItem toEntity() {
        return PmCouponItem.builder()
                .couponItemId(couponItemId)
                .couponId(couponId)
                .siteId(siteId)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
