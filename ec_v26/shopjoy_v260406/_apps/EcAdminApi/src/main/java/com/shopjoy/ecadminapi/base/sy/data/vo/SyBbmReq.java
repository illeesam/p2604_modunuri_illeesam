package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyBbm;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyBbmReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String bbmId;
    private String siteId;
    private String bbmCode;
    private String bbmNm;
    private String dispPath;
    private String bbmTypeCd;
    private String allowComment;
    private String allowAttach;
    private String allowLike;
    private String contentTypeCd;
    private String scopeTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String bbmRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyBbm toEntity() {
        return SyBbm.builder()
                .bbmId(bbmId)
                .siteId(siteId)
                .bbmCode(bbmCode)
                .bbmNm(bbmNm)
                .dispPath(dispPath)
                .bbmTypeCd(bbmTypeCd)
                .allowComment(allowComment)
                .allowAttach(allowAttach)
                .allowLike(allowLike)
                .contentTypeCd(contentTypeCd)
                .scopeTypeCd(scopeTypeCd)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .bbmRemark(bbmRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
