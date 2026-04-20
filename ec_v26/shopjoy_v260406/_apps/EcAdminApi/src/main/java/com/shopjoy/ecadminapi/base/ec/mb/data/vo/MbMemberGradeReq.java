package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGrade;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor
public class MbMemberGradeReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String gradeId;
    private String siteId;
    private String gradeCd;
    private String gradeNm;
    private Integer gradeRank;
    private Long minPurchaseAmt;
    private BigDecimal saveRate;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public MbMemberGrade toEntity() {
        return MbMemberGrade.builder()
                .gradeId(gradeId)
                .siteId(siteId)
                .gradeCd(gradeCd)
                .gradeNm(gradeNm)
                .gradeRank(gradeRank)
                .minPurchaseAmt(minPurchaseAmt)
                .saveRate(saveRate)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
