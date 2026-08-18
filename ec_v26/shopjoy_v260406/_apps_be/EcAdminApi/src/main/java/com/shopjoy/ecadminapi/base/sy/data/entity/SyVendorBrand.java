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
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_vendor_brand", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체별 브랜드 엔티티
@Comment("판매/배송업체-브랜드 매핑")
public class SyVendorBrand extends BaseEntity {

    @Id
    @Comment("업체브랜드ID (PK)")
    @Column(name = "vendor_brand_id", length = 21, nullable = false)
    @Size(max = 21, message = "vendorBrandId 는 21자 이내여야 합니다.")
    private String vendorBrandId;


    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    @Size(max = 21, message = "vendorId 는 21자 이내여야 합니다.")
    private String vendorId;

    @Comment("브랜드ID (sy_brand.brand_id)")
    @Column(name = "brand_id", length = 21, nullable = false)
    @Size(max = 21, message = "brandId 는 21자 이내여야 합니다.")
    private String brandId;

    @Comment("대표 브랜드 여부 Y/N")
    @Column(name = "is_main", length = 1)
    @Size(max = 1, message = "isMain 는 1자 이내여야 합니다.")
    private String isMain;

    @Comment("계약유형 (코드: CONTRACT_CD)")
    @Column(name = "contract_cd", length = 20)
    @Size(max = 20, message = "contractCd 는 20자 이내여야 합니다.")
    private String contractCd;

    @Comment("계약 시작일")
    @Column(name = "start_date")
    private LocalDate startDate;

    @Comment("계약 종료일")
    @Column(name = "end_date")
    private LocalDate endDate;

    @Comment("수수료율 (%)")
    @Column(name = "commission_rate")
    private BigDecimal commissionRate;

    @Comment("정렬순서")
    @Column(name = "sort_ord")
    private Integer sortOrd;

    @Comment("사용여부 Y/N")
    @Column(name = "use_yn", length = 1)
    @Size(max = 1, message = "useYn 는 1자 이내여야 합니다.")
    private String useYn;

    @Comment("비고")
    @Column(name = "vendor_brand_remark", length = 500)
    @Size(max = 100, message = "vendorBrandRemark 는 100자 이내여야 합니다.")
    private String vendorBrandRemark;

}
