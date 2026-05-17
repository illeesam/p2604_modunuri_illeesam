package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_brand", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 브랜드 엔티티
@Comment("브랜드")
public class SyBrand extends BaseEntity {

    @Id
    @Comment("브랜드ID (YYMMDDhhmmss+rand4)")
    @Column(name = "brand_id", length = 21, nullable = false)
    private String brandId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("브랜드코드")
    @Column(name = "brand_code", length = 50, nullable = false)
    private String brandCode;

    @Comment("브랜드명 (한글)")
    @Column(name = "brand_nm", length = 100, nullable = false)
    private String brandNm;

    @Comment("브랜드영문명")
    @Column(name = "brand_en_nm", length = 100)
    private String brandEnNm;

    @Comment("점(.) 구분 표시경로 (트리 빌드용)")
    @Column(name = "path_id", length = 21)
    private String pathId;

    @Comment("로고URL")
    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Comment("업체ID")
    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Comment("비고")
    @Column(name = "brand_remark", length = 300)
    private String brandRemark;

}
