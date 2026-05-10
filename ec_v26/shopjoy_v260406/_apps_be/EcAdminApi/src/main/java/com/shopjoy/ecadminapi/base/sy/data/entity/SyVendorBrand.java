package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_vendor_brand", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체별 브랜드 엔티티
public class SyVendorBrand extends BaseEntity {

    @Id
    @Column(name = "vendor_brand_id", length = 21, nullable = false)
    private String vendorBrandId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "brand_id", length = 21, nullable = false)
    private String brandId;

    @Column(name = "is_main", length = 1)
    private String isMain;

    @Column(name = "contract_cd", length = 20)
    private String contractCd;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Column(name = "use_yn", length = 1)
    private String useYn;

    @Column(name = "vendor_brand_remark", length = 500)
    private String vendorBrandRemark;

}
