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
    private String memberRoleId;

    @Comment("회원 ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("역할 ID (sy_role.role_id)")
    @Column(name = "role_id", length = 21, nullable = false)
    private String roleId;

    @Comment("권한 부여 관리자 ID")
    @Column(name = "grant_user_id", length = 21)
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
    private String memberRoleRemark;

}
