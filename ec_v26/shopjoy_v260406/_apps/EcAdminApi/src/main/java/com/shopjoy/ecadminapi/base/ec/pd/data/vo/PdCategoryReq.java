package com.shopjoy.ecadminapi.base.ec.pd.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.ec.pd.data.entity.PdCategory;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class PdCategoryReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String categoryId;
    private String siteId;
    private String parentCategoryId;
    private String categoryNm;
    private Integer categoryDepth;
    private Integer sortOrd;
    private String categoryStatusCd;
    private String categoryStatusCdBefore;
    private String imgUrl;
    private String categoryDesc;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public PdCategory toEntity() {
        return PdCategory.builder()
                .categoryId(categoryId)
                .siteId(siteId)
                .parentCategoryId(parentCategoryId)
                .categoryNm(categoryNm)
                .categoryDepth(categoryDepth)
                .sortOrd(sortOrd)
                .categoryStatusCd(categoryStatusCd)
                .categoryStatusCdBefore(categoryStatusCdBefore)
                .imgUrl(imgUrl)
                .categoryDesc(categoryDesc)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
