package com.shopjoy.eccdnapi.auth.dto;

import com.shopjoy.eccdnapi.auth.entity.CfTokenHist;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class CfTokenHistDto {
    private String histId;
    private String clientId;
    private String tokenId;
    private String actionCd;
    private String resultCd;
    private String resultMsg;
    private String reason;
    private String clientNm;
    private String refreshToken;
    private LocalDateTime accessTokenExp;
    private LocalDateTime refreshTokenExp;
    private Integer accessTokenTtlSec;
    private Integer refreshTokenTtlSec;
    private String issuedIp;
    private String requesterSystemNm;
    private String regBy;
    private LocalDateTime regDate;

    public static CfTokenHistDto from(CfTokenHist e) {
        return CfTokenHistDto.builder()
            .histId(e.getHistId())
            .clientId(e.getClientId())
            .tokenId(e.getTokenId())
            .actionCd(e.getActionCd())
            .resultCd(e.getResultCd())
            .resultMsg(e.getResultMsg())
            .reason(e.getReason())
            .clientNm(e.getClientNm())
            .refreshToken(e.getRefreshToken())
            .accessTokenExp(e.getAccessTokenExp())
            .refreshTokenExp(e.getRefreshTokenExp())
            .accessTokenTtlSec(e.getAccessTokenTtlSec())
            .refreshTokenTtlSec(e.getRefreshTokenTtlSec())
            .issuedIp(e.getIssuedIp())
            .requesterSystemNm(e.getRequesterSystemNm())
            .regBy(e.getRegBy())
            .regDate(e.getRegDate())
            .build();
    }
}
