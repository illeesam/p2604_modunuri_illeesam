package com.shopjoy.eccdnapi.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** cf_token_hist — 토큰 발급/재발급 이력(감사로그). action_cd=NEW 일 때만 client_nm 스냅샷을 채운다. */
@Entity
@Table(name = "cf_token_hist")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CfTokenHist {

    @Id
    @Column(name = "hist_id", length = 20)
    private String histId;

    @Column(name = "client_id", length = 40)
    private String clientId;

    @Column(name = "token_id", length = 20)
    private String tokenId;

    /** NEW(최초 로그인) / REFRESH(accessToken 재발급) */
    @Column(name = "action_cd", length = 10)
    private String actionCd;

    /** SUCCESS / FAIL — 요청사항: 실패 이력(비밀번호 불일치, 세션없음, 만료 등)도 기록. */
    @Column(name = "result_cd", length = 10)
    private String resultCd;

    /** 결과내용 — 실패 사유 상세 또는 성공 상세. */
    @Column(name = "result_msg", length = 300)
    private String resultMsg;

    @Column(name = "reason", length = 200)
    private String reason;

    @Column(name = "client_nm", length = 100)
    private String clientNm;

    /** 이 시점 관여된 refreshToken 값 스냅샷(요청사항 — 실패 건은 NULL). */
    @Column(name = "refresh_token", columnDefinition = "text")
    private String refreshToken;

    @Column(name = "access_token_exp")
    private LocalDateTime accessTokenExp;

    @Column(name = "refresh_token_exp")
    private LocalDateTime refreshTokenExp;

    @Column(name = "access_token_ttl_sec")
    private Integer accessTokenTtlSec;

    @Column(name = "refresh_token_ttl_sec")
    private Integer refreshTokenTtlSec;

    @Column(name = "issued_ip", length = 64)
    private String issuedIp;

    @Column(name = "requester_system_nm", length = 100)
    private String requesterSystemNm;

    @Column(name = "reg_by", length = 40)
    private String regBy;

    @Column(name = "reg_date")
    private LocalDateTime regDate;
}
