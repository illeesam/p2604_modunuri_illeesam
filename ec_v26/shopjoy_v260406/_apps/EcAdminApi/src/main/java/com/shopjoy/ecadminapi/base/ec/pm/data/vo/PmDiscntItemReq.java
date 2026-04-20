package com.shopjoy.ecadminapi.base.ec.pm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmDiscntItem;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PmDiscntItemReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String discntItemId;
    private String discntId;
    private String siteId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public PmDiscntItem toEntity() {
        return PmDiscntItem.builder()
                .discntItemId(discntItemId)
                .discntId(discntId)
                .siteId(siteId)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
