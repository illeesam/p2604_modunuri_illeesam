package com.shopjoy.ecBeBo.base.sy.data.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import com.shopjoy.ecBeBo.base.common.entity.BaseEntity;
import org.hibernate.annotations.Comment;

import jakarta.validation.constraints.Size;
@Entity
@Table(name = "syh_user_login_log", schema = "shopjoy_2604")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @SuperBuilder
// 사용자 로그인 로그 엔티티
@Comment("관리자 사용자 로그인 로그")
public class SyhUserLoginLog extends BaseEntity {

    @Id
    @Comment("로그ID (YYMMDDhhmmss+rand4)")
    @Column(name = "log_id", length = 21, nullable = false)
    @Size(max = 21, message = "logId 는 21자 이내여야 합니다.")
    private String logId;


    @Comment("인증ID")
    @Column(name = "auth_id", length = 21)
    @Size(max = 21, message = "authId 는 21자 이내여야 합니다.")
    private String authId;

    @Comment("사용자ID (로그인 실패 시 NULL)")
    @Column(name = "user_id", length = 21)
    @Size(max = 21, message = "userId 는 21자 이내여야 합니다.")
    private String userId;

    @Comment("입력한 로그인ID")
    @Column(name = "login_id", length = 100)
    @Size(max = 100, message = "loginId 는 100자 이내여야 합니다.")
    private String loginId;

    @Comment("로그인 시도일시")
    @Column(name = "login_date")
    private LocalDateTime loginDate;

    @Comment("결과 (코드: LOGIN_RESULT)")
    @Column(name = "result_cd", length = 20)
    @Size(max = 20, message = "resultCd 는 20자 이내여야 합니다.")
    private String resultCd;

    @Comment("해당 시점 연속 실패 횟수")
    @Column(name = "fail_cnt")
    private Integer failCnt;

    @Comment("IP주소")
    @Column(name = "ip", length = 50)
    @Size(max = 50, message = "ip 는 50자 이내여야 합니다.")
    private String ip;

    @Comment("User-Agent 전문")
    @Column(name = "device", length = 200)
    @Size(max = 200, message = "device 는 200자 이내여야 합니다.")
    private String device;

    @Comment("OS 정보")
    @Column(name = "os", length = 50)
    @Size(max = 50, message = "os 는 50자 이내여야 합니다.")
    private String os;

    @Comment("브라우저 정보")
    @Column(name = "browser", length = 50)
    @Size(max = 50, message = "browser 는 50자 이내여야 합니다.")
    private String browser;

    @Comment("액세스 토큰 (SHA-256 해시값 저장 권장, 로그인 실패 시 NULL)")
    @Column(name = "access_token", length = 512)
    @Size(max = 512, message = "accessToken 는 512자 이내여야 합니다.")
    private String accessToken;

    @Comment("액세스 토큰 만료일시")
    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Comment("리프레시 토큰 (SHA-256 해시값 저장 권장)")
    @Column(name = "refresh_token", length = 512)
    @Size(max = 512, message = "refreshToken 는 512자 이내여야 합니다.")
    private String refreshToken;

    @Comment("리프레시 토큰 만료일시")
    @Column(name = "refresh_token_exp")
    private LocalDateTime refreshTokenExp;

    @Comment("화면명 (X-UI-Nm 헤더)")
    @Column(name = "ui_nm", length = 200)
    @Size(max = 200, message = "uiNm 는 200자 이내여야 합니다.")
    private String uiNm;

    @Comment("기능명 (X-Cmd-Nm 헤더)")
    @Column(name = "cmd_nm", length = 200)
    @Size(max = 200, message = "cmdNm 는 200자 이내여야 합니다.")
    private String cmdNm;

}
