package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SySite;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SySiteReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String siteId;
    private String siteCode;
    private String siteTypeCd;
    private String siteNm;
    private String siteDomain;
    private String logoUrl;
    private String faviconUrl;
    private String siteDesc;
    private String siteEmail;
    private String sitePhone;
    private String siteZipCode;
    private String siteAddress;
    private String siteBusinessNo;
    private String siteCeo;
    private String siteStatusCd;
    private String configJson;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String dispPath;

    public SySite toEntity() {
        return SySite.builder()
                .siteId(siteId)
                .siteCode(siteCode)
                .siteTypeCd(siteTypeCd)
                .siteNm(siteNm)
                .siteDomain(siteDomain)
                .logoUrl(logoUrl)
                .faviconUrl(faviconUrl)
                .siteDesc(siteDesc)
                .siteEmail(siteEmail)
                .sitePhone(sitePhone)
                .siteZipCode(siteZipCode)
                .siteAddress(siteAddress)
                .siteBusinessNo(siteBusinessNo)
                .siteCeo(siteCeo)
                .siteStatusCd(siteStatusCd)
                .configJson(configJson)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .dispPath(dispPath)
                .build();
    }
}
