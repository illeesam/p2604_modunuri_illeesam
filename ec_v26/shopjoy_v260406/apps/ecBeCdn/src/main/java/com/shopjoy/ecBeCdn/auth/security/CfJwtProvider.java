package com.shopjoy.ecBeCdn.auth.security;

import com.shopjoy.ecBeCdn.common.config.CfProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

/**
 * accessToken(30초, app.cf.jwt.access-expiry-ms)/refreshToken(7일) 발급·검증.
 * EcAdminApi 의 JwtProvider 와 같은 jjwt 0.12.x API 를 쓰지만, 클레임은 clientId 하나뿐이라
 * 훨씬 단순하다 — 역할(roles)/부서/사이트 같은 개념이 이 서버엔 없음.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CfJwtProvider {

    private final CfProperties cfProperties;

    private SecretKey secretKey() {
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(cfProperties.getJwt().getSecret()));
    }

    public String createAccessToken(String clientId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + cfProperties.getJwt().getAccessExpiryMs());
        return Jwts.builder()
            .subject(clientId)
            .claim("type", "access")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey())
            .compact();
    }

    public String createRefreshToken(String clientId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + cfProperties.getJwt().getRefreshExpiryMs());
        return Jwts.builder()
            .subject(clientId)
            .claim("type", "refresh")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey())
            .compact();
    }

    /** access-expiry-ms 를 그대로 초 단위로 노출 — 로그인/리프레시 응답의 expiresIn 필드용. */
    public long getAccessExpirySeconds() {
        return cfProperties.getJwt().getAccessExpiryMs() / 1000;
    }

    /** refresh-expiry-ms 를 초 단위로 — cf_token.refresh_token_exp 계산용. */
    public long getRefreshExpirySeconds() {
        return cfProperties.getJwt().getRefreshExpiryMs() / 1000;
    }

    public boolean validate(String token) {
        try {
            Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.debug("[CfJwtProvider] token expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.warn("[CfJwtProvider] token invalid: {}", e.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parser().verifyWith(secretKey()).build().parseSignedClaims(token).getPayload();
    }

    /** 만료된 토큰도 클레임만 뽑아낸다(refresh 엔드포인트가 refreshToken 자체 검증에 사용). */
    public Claims getClaimsAllowExpired(String token) {
        try {
            return getClaims(token);
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public String getClientId(String token) {
        return getClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }
}
