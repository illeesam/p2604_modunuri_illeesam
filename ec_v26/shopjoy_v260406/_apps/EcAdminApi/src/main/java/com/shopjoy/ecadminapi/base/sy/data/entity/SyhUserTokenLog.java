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
@Table(name = "syh_user_token_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
public class SyhUserTokenLog extends BaseEntity {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "auth_id", length = 21)
    private String authId;

    @Column(name = "user_id", length = 21, nullable = false)
    private String userId;

    @Column(name = "login_log_id", length = 21)
    private String loginLogId;

    @Column(name = "action_cd", length = 20, nullable = false)
    private String actionCd;

    @Column(name = "token_type_cd", length = 20, nullable = false)
    private String tokenTypeCd;

    @Column(name = "access_token", length = 512, nullable = false)
    private String accessToken;

    @Column(name = "token_exp")
    private LocalDateTime tokenExp;

    @Column(name = "prev_token", length = 512)
    private String prevToken;

    @Column(name = "refresh_token", length = 512)
    private String refreshToken;

    @Column(name = "ip", length = 50)
    private String ip;

    @Column(name = "device_info", length = 200)
    private String deviceInfo;

    @Column(name = "revoke_reason", length = 200)
    private String revokeReason;

    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Column(name = "ui_nm", length = 200)
    private String uiNm;

    @Column(name = "cmd_nm", length = 200)
    private String cmdNm;

}
