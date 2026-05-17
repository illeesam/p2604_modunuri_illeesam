package com.shopjoy.ecadminapi.base.ec.mb.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecadminapi.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

@Entity
@Table(name = "mbh_member_token_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
@Comment("회원 토큰 이력")
public class MbhMemberTokenLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    private String logId;

    @Comment("사이트ID (sy_site.site_id)")
    @Column(name = "site_id", length = 21, nullable = false)
    private String siteId;

    @Comment("인증ID")
    @Column(name = "auth_id", length = 21)
    private String authId;

    @Comment("회원ID (mb_member.member_id)")
    @Column(name = "member_id", length = 21, nullable = false)
    private String memberId;

    @Comment("최초 로그인 로그ID (mb_member_login_log.)")
    @Column(name = "login_log_id", length = 21)
    private String loginLogId;

    @Comment("토큰 액션 (코드: TOKEN_ACTION — ISSUE/REFRESH/REVOKE/EXPIRE)")
    @Column(name = "action_cd", length = 20, nullable = false)
    private String actionCd;

    @Comment("토큰 유형 (코드: TOKEN_TYPE — ACCESS/REFRESH)")
    @Column(name = "token_type_cd", length = 20, nullable = false)
    private String tokenTypeCd;

    @Comment("토큰값 (SHA-256 해시 저장 권장)")
    @Column(name = "access_token", length = 512, nullable = false)
    private String accessToken;

    @Comment("토큰 만료일시")
    @Column(name = "token_exp")
    private LocalDateTime tokenExp;

    @Comment("갱신 전 토큰 해시 (REFRESH 액션 시)")
    @Column(name = "prev_token", length = 512)
    private String prevToken;

    @Comment("리푸레쉬 토큰")
    @Column(name = "refresh_token", length = 512)
    private String refreshToken;

    @Comment("IP주소")
    @Column(name = "ip", length = 50)
    private String ip;

    @Comment("User-Agent")
    @Column(name = "device_info", length = 200)
    private String deviceInfo;

    @Comment("폐기 사유 (LOGOUT/FORCE/EXPIRED 등)")
    @Column(name = "revoke_reason", length = 200)
    private String revokeReason;

    @Comment("액세스 토큰 만료일시")
    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Comment("화면명 (X-UI-Nm 헤더)")
    @Column(name = "ui_nm", length = 200)
    private String uiNm;

    @Comment("기능명 (X-Cmd-Nm 헤더)")
    @Column(name = "cmd_nm", length = 200)
    private String cmdNm;

}
