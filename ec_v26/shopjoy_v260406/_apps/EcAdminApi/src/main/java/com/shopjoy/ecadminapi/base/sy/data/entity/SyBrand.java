package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_brand", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 브랜드 엔티티
public class SyBrand {

    @Id
    @Column(name = "brand_id", length = 21, nullable = false)
    private String brandId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "brand_code", length = 50, nullable = false)
    private String brandCode;

    @Column(name = "brand_nm", length = 100, nullable = false)
    private String brandNm;

    @Column(name = "brand_en_nm", length = 100)
    private String brandEnNm;

    @Column(name = "disp_path", length = 200)
    private String dispPath;

    @Column(name = "logo_url", length = 500)
    private String logoUrl;

    @Column(name = "vendor_id", length = 21)
    private String vendorId;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "brand_remark", length = 300)
    private String brandRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}