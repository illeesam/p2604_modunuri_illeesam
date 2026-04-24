package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mb_member_role", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 역할 연결 엔티티
public class MbMemberRole {

    @Id
    @Column(name = "member_role_id", length = 21, nullable = false)
    private String memberRoleId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

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

    @Column(name = "member_role_remark", length = 500)
    private String memberRoleRemark;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
