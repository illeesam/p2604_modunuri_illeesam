package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.experimental.SuperBuilder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
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
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;

    @Comment("사이트코드")
    @Column(name = "site_code", length = 50, nullable = false)
    @Size(max = 50, message = "siteCode 는 50자 이내여야 합니다.")
    private String siteCode;

    @Comment("사이트유형 (코드: SITE_TYPE_CD — EC/ADMIN/API)")
    @Column(name = "site_type_cd", length = 20)
    @Size(max = 20, message = "siteTypeCd 는 20자 이내여야 합니다.")
    private String siteTypeCd;

    @Comment("사이트명")
    @Column(name = "site_nm", length = 100, nullable = false)
    @Size(max = 100, message = "siteNm 는 100자 이내여야 합니다.")
    private String siteNm;

    @Comment("도메인")
    @Column(name = "site_domain", length = 200)
    @Size(max = 200, message = "siteDomain 는 200자 이내여야 합니다.")
    private String siteDomain;

    @Comment("로고URL")
    @Column(name = "logo_url", length = 500)
    @Size(max = 500, message = "logoUrl 는 500자 이내여야 합니다.")
    private String logoUrl;

    @Comment("파비콘URL")
    @Column(name = "favicon_url", length = 500)
    @Size(max = 500, message = "faviconUrl 는 500자 이내여야 합니다.")
    private String faviconUrl;

    @Comment("사이트설명")
    @Column(name = "site_desc", columnDefinition = "TEXT")
    @Size(max = 500000, message = "siteDesc 는 500,000자 이내여야 합니다.")
    private String siteDesc;

    @Comment("대표이메일")
    @Column(name = "site_email", length = 100)
    @Size(max = 100, message = "siteEmail 는 100자 이내여야 합니다.")
    private String siteEmail;

    @Comment("대표전화")
    @Column(name = "site_phone", length = 20)
    @Size(max = 20, message = "sitePhone 는 20자 이내여야 합니다.")
    private String sitePhone;

    @Comment("우편번호")
    @Column(name = "site_zip_code", length = 10)
    @Size(max = 10, message = "siteZipCode 는 10자 이내여야 합니다.")
    private String siteZipCode;

    @Comment("주소")
    @Column(name = "site_address", length = 300)
    @Size(max = 300, message = "siteAddress 는 300자 이내여야 합니다.")
    private String siteAddress;

    @Comment("사업자번호")
    @Column(name = "site_business_no", length = 20)
    @Size(max = 20, message = "siteBusinessNo 는 20자 이내여야 합니다.")
    private String siteBusinessNo;

    @Comment("대표자명")
    @Column(name = "site_ceo", length = 50)
    @Size(max = 50, message = "siteCeo 는 50자 이내여야 합니다.")
    private String siteCeo;

    @Comment("상태 (코드: SITE_STATUS_CD)")
    @Column(name = "site_status_cd", length = 20)
    @Size(max = 20, message = "siteStatusCd 는 20자 이내여야 합니다.")
    private String siteStatusCd;

    @Comment("확장설정 (JSON)")
    @Column(name = "config_json", columnDefinition = "TEXT")
    @Size(max = 500000, message = "configJson 는 500,000자 이내여야 합니다.")
    private String configJson;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    @Size(max = 21, message = "pathId 는 21자 이내여야 합니다.")
    private String pathId;

}
