package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmEventItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmEventItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String eventItemId;
    private String eventId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private Integer sortNo;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmEventItem toEntity() {
        return PmEventItem.builder()
                .eventItemId(eventItemId)
                .eventId(eventId)
                .siteId(siteId)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .sortNo(sortNo)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
