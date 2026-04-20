package com.shopjoy.ecadminapi.base.ec.mb.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbLike;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbLikeReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String likeId;
    private String siteId;
    private String memberId;
    private String targetTypeCd;
    private String targetId;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public MbLike toEntity() {
        return MbLike.builder()
                .likeId(likeId)
                .siteId(siteId)
                .memberId(memberId)
                .targetTypeCd(targetTypeCd)
                .targetId(targetId)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
