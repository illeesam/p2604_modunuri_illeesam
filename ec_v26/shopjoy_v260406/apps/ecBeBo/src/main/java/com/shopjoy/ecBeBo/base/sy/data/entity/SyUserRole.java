package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "sy_user_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사용자별 역할 엔티티
@Comment("관리자 사용자-역할 매핑 (N:M)")
public class SyUserRole extends BaseEntity {

    @Id
    @Comment("사용자역할ID (YYMMDDhhmmss+rand4)")
    @Column(name = "user_role_id", length = 21, nullable = false)
    @Size(max = 21, message = "userRoleId 는 21자 이내여야 합니다.")
    private String userRoleId;


    @Comment("사용자ID (sy_user.user_id, UNIQUE with role_id)")
    @Column(name = "user_id", length = 21, nullable = false)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;

    @Comment("역할ID (sy_role.role_id, UNIQUE with user_id)")
    @Column(name = "role_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;

    @Comment("부여자 (sy_user.user_id)")
    @Column(name = "grant_user_id", length = 21)
    @Size(max = 21, message = "grantUserId 는 21자 이내여야 합니다.")
    private String grantUserId;

    @Comment("부여일시")
    @Column(name = "grant_date")
    private LocalDateTime grantDate;

    @Comment("적용 시작일")
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Comment("적용 종료일")
    @Column(name = "valid_to")
    private LocalDate validTo;

    @Comment("비고")
    @Column(name = "user_role_remark", length = 500)
    @Size(max = 500, message = "userRoleRemark 는 500자 이내여야 합니다.")
    private String userRoleRemark;

}
