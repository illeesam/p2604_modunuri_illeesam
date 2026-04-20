package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyI18n;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyI18nReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String i18nId;
    private String siteId;
    private String i18nKey;
    private String i18nDesc;
    private String i18nScopeCd;
    private String i18nCategory;
    private Integer sortOrd;
    private String useYn;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyI18n toEntity() {
        return SyI18n.builder()
                .i18nId(i18nId)
                .siteId(siteId)
                .i18nKey(i18nKey)
                .i18nDesc(i18nDesc)
                .i18nScopeCd(i18nScopeCd)
                .i18nCategory(i18nCategory)
                .sortOrd(sortOrd)
                .useYn(useYn)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
