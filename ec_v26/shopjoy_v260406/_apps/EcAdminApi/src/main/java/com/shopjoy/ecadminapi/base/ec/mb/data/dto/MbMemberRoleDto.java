package com.shopjoy.ecadminapi.base.ec.mb.data.dto;

import lombok.Getter;
import lombok.Setter;
import lombok.NoArgsConstructor;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class MbMemberRoleDto {

    // ── mb_member_role ──────────────────────────────────────────
    private String memberRoleId;
    private String memberId;
    private String roleId;
    private String grantUserId;
    private LocalDateTime grantDate;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String memberRoleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    // ── JOIN ────────────────────────────────────────────────────
    private String memberNm;
    private String roleNm;
    private String grantUserNm;
}
