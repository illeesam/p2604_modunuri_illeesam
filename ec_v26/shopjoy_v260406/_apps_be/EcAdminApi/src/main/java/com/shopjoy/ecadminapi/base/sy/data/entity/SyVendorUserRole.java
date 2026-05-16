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
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "sy_vendor_user_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 업체 사용자 역할 연결 엔티티
@Comment("업체 사용자 역할 연결")
public class SyVendorUserRole extends BaseEntity {

    @Id
    @Comment("업체사용자역할ID (PK)")
    @Column(name = "vendor_user_role_id", length = 21, nullable = false)
    private String vendorUserRoleId;

    @Comment("업체ID (sy_vendor.vendor_id)")
    @Column(name = "vendor_id", length = 21, nullable = false)
    private String vendorId;

    @Comment("업체사용자ID (sy_vendor_user.vendor_user_id)")
    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Comment("역할ID (sy_role.role_id)")
    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Comment("역할 부여자 (sy_user.user_id)")
    @Column(name = "grant_user_id", length = 21)
    private String grantUserId;

    @Comment("역할 부여일시")
    @Column(name = "grant_date")
    private LocalDateTime grantDate;

    @Comment("유효 시작일")
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Comment("유효 종료일")
    @Column(name = "valid_to")
    private LocalDate validTo;

    @Comment("비고")
    @Column(name = "vendor_user_role_remark", length = 500)
    private String vendorUserRoleRemark;

}
