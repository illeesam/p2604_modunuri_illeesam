package com.shopjoy.ecadminapi.base.ec.od.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.od.data.entity.OdPayMethod;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class OdPayMethodReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String payMethodId;
    private String memberId;
    private String payMethodTypeCd;
    private String payMethodNm;
    private String payMethodAlias;
    private String payKeyNo;
    private String mainMethodYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public OdPayMethod toEntity() {
        return OdPayMethod.builder()
                .payMethodId(payMethodId)
                .memberId(memberId)
                .payMethodTypeCd(payMethodTypeCd)
                .payMethodNm(payMethodNm)
                .payMethodAlias(payMethodAlias)
                .payKeyNo(payKeyNo)
                .mainMethodYn(mainMethodYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
