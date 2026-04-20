package com.shopjoy.ecadminapi.base.sy.data.vo;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor
public class SyUserReq {

    @JsonProperty("_row_status")
    private String rowStatus;   // I: insert, U: update, D: delete

    private String userId;
    private String siteId;
    private String loginId;
    private String userPassword;
    private String userNm;
    private String userEmail;
    private String userPhone;
    private String deptId;
    private String roleId;
    private String userStatusCd;
    private LocalDateTime lastLogin;
    private Integer loginFailCnt;
    private String userMemo;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;
    private String authMethodCd;
    private LocalDateTime lastLoginDate;

    public SyUser toEntity() {
        return SyUser.builder()
                .userId(userId)
                .siteId(siteId)
                .loginId(loginId)
                .userPassword(userPassword)
                .userNm(userNm)
                .userEmail(userEmail)
                .userPhone(userPhone)
                .deptId(deptId)
                .roleId(roleId)
                .userStatusCd(userStatusCd)
                .lastLogin(lastLogin)
                .loginFailCnt(loginFailCnt)
                .userMemo(userMemo)
                .regBy(regBy)
                .regDate(regDate)
                .updBy(updBy)
                .updDate(updDate)
                .authMethodCd(authMethodCd)
                .lastLoginDate(lastLoginDate)
                .build();
    }
}
