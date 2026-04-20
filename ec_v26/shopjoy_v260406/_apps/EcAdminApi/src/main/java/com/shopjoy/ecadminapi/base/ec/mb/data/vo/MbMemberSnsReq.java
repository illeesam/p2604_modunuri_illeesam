package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberSnsReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String memberSnsId;
    private String memberId;
    private String snsChannelCd;
    private String snsUserId;
    private String regBy;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public MbMemberSns toEntity() {
        return MbMemberSns.builder()
                .memberSnsId(memberSnsId)
                .memberId(memberId)
                .snsChannelCd(snsChannelCd)
                .snsUserId(snsUserId)
                .regBy(regBy)
                .regDate(regDate)
                .build();
    }
}
