package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventBenefit;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventBenefitReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String benefitId;
    private String siteId;
    private String eventId;
    private String benefitNm;
    private String benefitTypeCd;
    private String conditionDesc;
    private String benefitValue;
    private String couponId;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PmEventBenefit toEntity() {
        return PmEventBenefit.builder()
                .benefitId(benefitId)
                .siteId(siteId)
                .eventId(eventId)
                .benefitNm(benefitNm)
                .benefitTypeCd(benefitTypeCd)
                .conditionDesc(conditionDesc)
                .benefitValue(benefitValue)
                .couponId(couponId)
                .sortOrd(sortOrd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
