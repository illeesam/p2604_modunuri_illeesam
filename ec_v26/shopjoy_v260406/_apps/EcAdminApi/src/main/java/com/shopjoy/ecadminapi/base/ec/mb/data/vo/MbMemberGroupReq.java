package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberGroup;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberGroupReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String groupId;
    private String siteId;
    private String groupNm;
    private String groupMemo;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public MbMemberGroup toEntity() {
        return MbMemberGroup.builder()
                .groupId(groupId)
                .siteId(siteId)
                .groupNm(groupNm)
                .groupMemo(groupMemo)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
