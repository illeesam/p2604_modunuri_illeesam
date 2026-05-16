package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_site", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사이트 엔티티
@Comment("사이트")
public class SySite extends BaseEntity {

    @Id
    @Comment("사이트ID (YYMMDDhhmmss+rand4)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("사이트코드")
    @Column(name = "site_code", length = 50, nullable = false)
    private String siteCode;

    @Comment("사이트유형 (코드: SITE_TYPE — EC/ADMIN/API)")
    @Column(name = "site_type_cd", length = 20)
    private String siteTypeCd;

    @Comment("사이트명")
    @Column(name = "site_nm", length = 100, nullable = false)
    private String siteNm;

    @Comment("도메인")
    @Column(name = "site_domain", length = 200)
    private String siteDomain;

    @Comment("로고URL")
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Comment("파비콘URL")
    @Column(name = "favicon_url", length = 500)
    private String faviconUrl;

    @Comment("사이트설명")
    @Column(name = "site_desc", columnDefinition = "TEXT")
    private String siteDesc;

    @Comment("대표이메일")
    @Column(name = "site_email", length = 100)
    private String siteEmail;

    @Comment("대표전화")
    @Column(name = "site_phone", length = 20)
    private String sitePhone;

    @Comment("우편번호")
    @Column(name = "site_zip_code", length = 10)
    private String siteZipCode;

    @Comment("주소")
    @Column(name = "site_address", length = 300)
    private String siteAddress;

    @Comment("사업자번호")
    @Column(name = "site_business_no", length = 20)
    private String siteBusinessNo;

    @Comment("대표자명")
    @Column(name = "site_ceo", length = 50)
    private String siteCeo;

    @Comment("상태 (코드: SITE_STATUS)")
    @Column(name = "site_status_cd", length = 20)
    private String siteStatusCd;

    @Comment("확장설정 (JSON)")
    @Column(name = "config_json", columnDefinition = "TEXT")
    private String configJson;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

}
