package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "sy_vendor_user_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체 사용자 역할 연결 엔티티
public class SyVendorUserRole extends BaseEntity {

    @Id
    @Column(name = "vendor_user_role_id", length = 21, nullable = false)
    private String vendorUserRoleId;

    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Column(name = "grant_user_id", length = 21)
    private String grantUserId;

    @Column(name = "grant_date")
    private LocalDateTime grantDate;

    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Column(name = "valid_to")
    private LocalDate validTo;

    @Column(name = "vendor_user_role_remark", length = 500)
    private String vendorUserRoleRemark;

}
