package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "mbh_member_token_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
// 회원 토큰 로그 엔티티
public class MbhMemberTokenLog {

    @Id
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Column(name = "site_id", length = 21)
    private String siteId;

    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Column(name = "login_log_id", length = 21)
    private String loginLogId;

    @Column(name = "action_cd", length = 20, nullable = false)
    private String actionCd;

    @Column(name = "token_type_cd", length = 20, nullable = false)
    private String tokenTypeCd;

    @Column(name = "token", length = 512, nullable = false)
    private String token;

    @Column(name = "token_exp")
    private LocalDateTime tokenExp;

    @Column(name = "prev_token", length = 512)
    private String prevToken;

    @Column(name = "ip", length = 50)
    private String ip;

    @Column(name = "device", length = 200)
    private String device;

    @Column(name = "revoke_reason", length = 200)
    private String revokeReason;

    @Column(name = "reg_by", length = 30)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 30)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;

}