package com.shopjoy.ecadminapi.base.sy.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SySiteDto {

    // ── sy_site ──────────────────────────────────────────
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

    // ── JOIN: 필요 시 추가 ────────────────────────────────────────
}
