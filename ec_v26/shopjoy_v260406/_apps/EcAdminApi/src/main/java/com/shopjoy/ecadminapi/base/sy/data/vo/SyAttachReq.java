package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyAttach;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyAttachReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String attachId;
    private String siteId;
    private String attachGrpId;
    private String fileNm;
    private Long fileSize;
    private String fileExt;
    private String mimeTypeCd;
    private String storedNm;
    private String attachUrl;
    private String cdnHost;
    private String cdnImgUrl;
    private String cdnThumbUrl;
    private Integer sortOrd;
    private String attachMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyAttach toEntity() {
        return SyAttach.builder()
                .attachId(attachId)
                .siteId(siteId)
                .attachGrpId(attachGrpId)
                .fileNm(fileNm)
                .fileSize(fileSize)
                .fileExt(fileExt)
                .mimeTypeCd(mimeTypeCd)
                .storedNm(storedNm)
                .attachUrl(attachUrl)
                .cdnHost(cdnHost)
                .cdnImgUrl(cdnImgUrl)
                .cdnThumbUrl(cdnThumbUrl)
                .sortOrd(sortOrd)
                .attachMemo(attachMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
