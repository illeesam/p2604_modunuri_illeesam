package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUserRole;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyUserRoleReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String userRoleId;
    private String userId;
    private String roleId;
    private String grantUserId;
    private LocalDateTime grantDate;
    private LocalDate validFrom;
    private LocalDate validTo;
    private String userRoleRemark;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public SyUserRole toEntity() {
        return SyUserRole.builder()
                .userRoleId(userRoleId)
                .userId(userId)
                .roleId(roleId)
                .grantUserId(grantUserId)
                .grantDate(grantDate)
                .validFrom(validFrom)
                .validTo(validTo)
                .userRoleRemark(userRoleRemark)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .build();
    }
}
