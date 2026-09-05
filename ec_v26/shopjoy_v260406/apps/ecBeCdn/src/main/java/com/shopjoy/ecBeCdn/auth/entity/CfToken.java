package com.shopjoy.ecBeCdn.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** cf_token — 발급된(만료 전) 토큰. client_id 당 여러 행 가능(멀티 인스턴스 호출자 대비, FO 멀티디바이스 정책과 동일). */
@Entity
@Table(name = "cf_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CfToken {

    @Id
    @Column(name = "token_id", length = 20)
    private String tokenId;

    @Column(name = "client_id", length = 40)
    private String clientId;

    @Column(name = "access_token", columnDefinition = "text")
    private String accessToken;

    @Column(name = "refresh_token", columnDefinition = "text")
    private String refreshToken;

    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Column(name = "refresh_token_exp")
    private LocalDateTime refreshTokenExp;

    /** 발급 당시 적용된 유효시간(초) — 설정값이 나중에 바뀌어도 그 시점 값 보존. */
    @Column(name = "access_token_ttl_sec")
    private Integer accessTokenTtlSec;

    @Column(name = "refresh_token_ttl_sec")
    private Integer refreshTokenTtlSec;

    /** 최근 발급/재발급 사유 — cf_token_hist 최신 행의 reason 미러(조인 없이 바로 조회). */
    @Column(name = "reason", length = 200)
    private String reason;

    @Column(name = "issued_ip", length = 64)
    private String issuedIp;

    /** 요청 시스템 이름(X-Caller-System 헤더) — 마이크로서비스 환경에서 IP만으론 모호한 "어느 서비스"를 구분. */
    @Column(name = "requester_system_nm", length = 100)
    private String requesterSystemNm;

    @Column(name = "reg_by", length = 40)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;

    @Column(name = "upd_by", length = 40)
    private String updBy;

    @Column(name = "upd_date")
    private LocalDateTime updDate;
}
