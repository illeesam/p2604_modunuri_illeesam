package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sy_user", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 사용자(관리자) 엔티티
public class SyUser {

    @Id
    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "login_id", length = 50, nullable = false)
    private String loginId;

    @Column(name = "user_password", length = 255, nullable = false)
    private String userPassword;

    @Column(name = "user_nm", length = 50, nullable = false)
    private String userNm;

    @Column(name = "user_email", length = 100)
    private String userEmail;

    @Column(name = "user_phone", length = 20)
    private String userPhone;

    @Column(name = "dept_id", length = 21)
    private String deptId;

    @Column(name = "role_id", length = 21)
    private String roleId;

    @Column(name = "user_status_cd", length = 20)
    private String userStatusCd;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "login_fail_cnt")
    private Integer loginFailCnt;

    @Lob
    @Column(name = "user_memo", columnDefinition = "TEXT")
    private String userMemo;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

    @Column(name = "auth_method_cd", length = 20)
    private String authMethodCd;

    @Column(name = "last_login_date")
    private LocalDateTime lastLoginDate;

}