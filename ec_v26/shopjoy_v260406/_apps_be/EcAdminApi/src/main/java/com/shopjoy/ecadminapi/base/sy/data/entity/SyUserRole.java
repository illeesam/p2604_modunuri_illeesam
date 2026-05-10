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
@Table(name = "sy_user_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사용자별 역할 엔티티
public class SyUserRole extends BaseEntity {

    @Id
    @Column(name = "user_role_id", length = 21, nullable = false)
    private String userRoleId;

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

    @Column(name = "user_role_remark", length = 500)
    private String userRoleRemark;

}
