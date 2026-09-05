package com.shopjoy.ecBeCdn.auth.dto;

import com.shopjoy.ecBeCdn.auth.entity.CfToken;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

/** cf_token 목록 응답 — 내부 진단용 화면이라 accessToken/refreshToken 원문을 그대로 노출한다. */
@Getter
@Builder
public class CfTokenDto {
    private String tokenId;
    private String clientId;
    private String accessToken;
    private String refreshToken;
    private LocalDateTime accessTokenExp;
    private LocalDateTime refreshTokenExp;
    private Integer accessTokenTtlSec;
    private Integer refreshTokenTtlSec;
    private String reason;
    private String issuedIp;
    private String requesterSystemNm;
    private String regBy;
    private LocalDateTime regDate;
    private String updBy;
    private LocalDateTime updDate;

    public static CfTokenDto from(CfToken e) {
        return CfTokenDto.builder()
            .tokenId(e.getTokenId())
            .clientId(e.getClientId())
            .accessToken(e.getAccessToken())
            .refreshToken(e.getRefreshToken())
            .accessTokenExp(e.getAccessTokenExp())
            .refreshTokenExp(e.getRefreshTokenExp())
            .accessTokenTtlSec(e.getAccessTokenTtlSec())
            .refreshTokenTtlSec(e.getRefreshTokenTtlSec())
            .reason(e.getReason())
            .issuedIp(e.getIssuedIp())
            .requesterSystemNm(e.getRequesterSystemNm())
            .regBy(e.getRegBy())
            .regDate(e.getRegDate())
            .updBy(e.getUpdBy())
            .updDate(e.getUpdDate())
            .build();
    }
}
