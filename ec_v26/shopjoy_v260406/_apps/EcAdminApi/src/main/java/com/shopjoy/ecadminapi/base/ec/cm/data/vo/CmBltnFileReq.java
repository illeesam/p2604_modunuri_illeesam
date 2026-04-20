package com.shopjoy.ecadminapi.base.ec.cm.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmBltnFile;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class CmBltnFileReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String blogImgId;
    private String blogId;
    private String imgUrl;
    private String thumbUrl;
    private String imgAltText;
    private Integer sortOrd;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public CmBltnFile toEntity() {
        return CmBltnFile.builder()
                .blogImgId(blogImgId)
                .blogId(blogId)
                .imgUrl(imgUrl)
                .thumbUrl(thumbUrl)
                .imgAltText(imgAltText)
                .sortOrd(sortOrd)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
