package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBlogGood;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBlogGoodReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String likeId;
    private String blogId;
    private String userId;
    private LocalDateTime regDate;

    private String updBy;
    private LocalDateTime updDate;

    /** toEntity — 변환 */
    public CmBlogGood toEntity() {
        return CmBlogGood.builder()
                .likeId(likeId)
                .blogId(blogId)
                .userId(userId)
                .regDate(regDate)
                .build();
    }
}
