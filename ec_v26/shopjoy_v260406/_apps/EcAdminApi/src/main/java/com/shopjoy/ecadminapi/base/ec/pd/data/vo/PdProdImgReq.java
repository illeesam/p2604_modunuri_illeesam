package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdProdImg;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdProdImgReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String prodImgId;
    private String siteId;
    private String prodId;
    private String optItemId1;
    private String optItemId2;
    private String attachId;
    private String cdnHost;
    private String cdnImgUrl;
    private String cdnThumbUrl;
    private String imgAltText;
    private Integer sortOrd;
    private String isThumb;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdProdImg toEntity() {
        return PdProdImg.builder()
                .prodImgId(prodImgId)
                .siteId(siteId)
                .prodId(prodId)
                .optItemId1(optItemId1)
                .optItemId2(optItemId2)
                .attachId(attachId)
                .cdnHost(cdnHost)
                .cdnImgUrl(cdnImgUrl)
                .cdnThumbUrl(cdnThumbUrl)
                .imgAltText(imgAltText)
                .sortOrd(sortOrd)
                .isThumb(isThumb)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
