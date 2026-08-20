package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

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

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "mb_member_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 회원 역할 연결 엔티티
@Comment("회원 역할 연결")
public class MbMemberRole extends BaseEntity {

    @Id
    @Comment("PK")
    @Column(name = "member_role_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberRoleId 는 21자 이내여야 합니다.")
    private String memberRoleId;

    @Comment("사이트ID (sy_site.site_id) - 업무 소속 사이트")
    @Column(name = "site_id", length = 21, nullable = false)
    @Size(max = 21, message = "siteId 는 21자 이내여야 합니다.")
    private String siteId;


    @Comment("회원 ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    @Size(max = 21, message = "memberId 는 21자 이내여야 합니다.")
    private String memberId;

    @Comment("역할 ID (sy_role.role_id)")
    @Column(name = "role_id", length = 21, nullable = false)
    @Size(max = 21, message = "roleId 는 21자 이내여야 합니다.")
    private String roleId;

    @Comment("권한 부여 관리자 ID")
    @Column(name = "grant_user_id", length = 21)
    @Size(max = 21, message = "grantUserId 는 21자 이내여야 합니다.")
    private String grantUserId;

    @Comment("권한 부여 일시")
    @Column(name = "grant_date")
    private LocalDateTime grantDate;

    @Comment("유효 시작일")
    @Column(name = "valid_from")
    private LocalDate validFrom;

    @Comment("유효 종료일")
    @Column(name = "valid_to")
    private LocalDate validTo;

    @Comment("비고")
    @Column(name = "member_role_remark", length = 500)
    @Size(max = 100, message = "memberRoleRemark 는 100자 이내여야 합니다.")
    private String memberRoleRemark;

}
