package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_site", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사이트 엔티티
public class SySite extends BaseEntity {

    @Id
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Column(name = "site_code", length = 50, nullable = false)
    private String siteCode;

    @Column(name = "site_type_cd", length = 20)
    private String siteTypeCd;

    @Column(name = "site_nm", length = 100, nullable = false)
    private String siteNm;

    @Column(name = "site_domain", length = 200)
    private String siteDomain;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Column(name = "site_desc", columnDefinition = "TEXT")
    private String siteDesc;

    @Column(name = "site_email", length = 100)
    private String siteEmail;

    @Column(name = "site_phone", length = 20)
    private String sitePhone;

    @Column(name = "site_zip_code", length = 10)
    private String siteZipCode;

    @Column(name = "site_address", length = 300)
    private String siteAddress;

    @Column(name = "site_business_no", length = 20)
    private String siteBusinessNo;

    @Column(name = "site_ceo", length = 50)
    private String siteCeo;

    @Column(name = "site_status_cd", length = 20)
    private String siteStatusCd;

    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Column(name = "path_id", length = 21)
    private String pathId;

}
