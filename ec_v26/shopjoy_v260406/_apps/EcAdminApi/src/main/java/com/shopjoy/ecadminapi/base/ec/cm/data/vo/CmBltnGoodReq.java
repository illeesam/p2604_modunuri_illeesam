package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnGood;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnGoodReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String likeId;
    private String blogId;
    private String userId;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    public CmBltnGood toEntity() {
        return CmBltnGood.builder()
                .likeId(likeId)
                .blogId(blogId)
                .userId(userId)
                .regDate(regDate)
                .build();
    }
}
