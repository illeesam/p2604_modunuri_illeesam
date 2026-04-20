package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyProp;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyPropReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String siteId;
    private String dispPath;
    private String propKey;
    private String propValue;
    private String propLabel;
    private String propTypeCd;
    private Integer sortOrd;
    private String useYn;
    private String propRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyProp toEntity() {
        return SyProp.builder()
                .siteId(siteId)
                .dispPath(dispPath)
                .propKey(propKey)
                .propValue(propValue)
                .propLabel(propLabel)
                .propTypeCd(propTypeCd)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .propRemark(propRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
