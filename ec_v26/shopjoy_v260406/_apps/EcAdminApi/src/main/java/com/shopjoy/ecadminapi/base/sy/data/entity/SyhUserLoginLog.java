package com.shopjoy.ecadminapi.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;

@Entity
@Table(name = "syh_user_login_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사용자 로그인 로그 엔티티
public class SyhUserLoginLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "auth_id", length = 21)
    private String authId;

    @Column(name = "user_id", length = 21)
    private String userId;

    @Column(name = "login_id", length = 100)
    private String loginId;

    @Column(name = "login_date")
    private LocalDateTime loginDate;

    @Column(name = "result_cd", length = 20)
    private String resultCd;

    @Column(name = "fail_cnt")
    private Integer failCnt;

    @Column(name = "ip", length = 50)
    private String ip;

    @Column(name = "device", length = 200)
    private String device;

    @Column(name = "os", length = 50)
    private String os;

    @Column(name = "browser", length = 50)
    private String browser;

    @Column(name = "access_token", length = 512)
    private String accessToken;

    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Column(name = "refresh_token", length = 512)
    private String refreshToken;

    @Column(name = "refresh_token_exp")
    private LocalDateTime refreshTokenExp;

    @Column(name = "ui_nm", length = 100)
    private String uiNm;

    @Column(name = "cmd_nm", length = 100)
    private String cmdNm;

}
