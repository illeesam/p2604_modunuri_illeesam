package com.shopjoy.ecadminapi.auth.security;

import com.shopjoy.ecadminapi.auth.data.dto.AccessTokenClaims;
import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;

@Slf4j
@Component
public class JwtProvider {

    private final SecretKey secretKey;
    private final long accessExpiry;
    private final long boRefreshExpiry;   // BO 관리자: 2시간
    private final long foRefreshExpiry;   // FO 회원: 15일

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiry}") long accessExpiry,
            @Value("${jwt.bo-refresh-expiry}") long boRefreshExpiry,
            @Value("${jwt.fo-refresh-expiry}") long foRefreshExpiry) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessExpiry = accessExpiry;
        this.boRefreshExpiry = boRefreshExpiry;
        this.foRefreshExpiry = foRefreshExpiry;
    }

    /**
     * Access Token 생성.
     * JWT 클레임에 AuthPrincipal 구성에 필요한 모든 정보를 포함시켜
     * JwtAuthFilter에서 DB 없이 AuthPrincipal을 완벽하게 복원할 수 있게 한다.
     */
    public String createAccessToken(AccessTokenClaims claims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpiry);

        return Jwts.builder()
            .subject(claims.getAuthId())
            .claim("loginId", claims.getLoginId())
            .claim("roles", claims.getRoles())
            .claim("type", "access")
            .claim("userTypeCd", claims.getUserTypeCd())
            .claim("roleId", claims.getRoleId())
            .claim("vendorId", claims.getVendorId())
            .claim("siteId", claims.getSiteId())
            .claim("userId", claims.getUserId())
            .claim("memberId", claims.getMemberId())
            .claim("memberGrade", claims.getMemberGrade())
            .claim("isStaffYn", claims.getIsStaffYn())
            .claim("isAdminYn", claims.getIsAdminYn())
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    /**
     * Refresh Token 생성 — userTypeCd에 따라 만료시간 분리.
     * "BO": 2시간 (1세션, Sliding), "FO": 15일 (멀티디바이스, Sliding)
     */
    public String createRefreshToken(String authId, String userTypeCd) {
        Date now = new Date();
        long expiry = "BO".equals(userTypeCd) ? boRefreshExpiry : foRefreshExpiry;
        Date expiryDate = new Date(now.getTime() + expiry);

        return Jwts.builder()
            .subject(authId)
            .claim("type", "refresh")
            .claim("userTypeCd", userTypeCd)
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(secretKey)
            .compact();
    }

    public long getAccessExpiryMinutes() { return accessExpiry / 60_000; }
    public long getBoRefreshExpiryMinutes() { return boRefreshExpiry / 60_000; }
    public long getFoRefreshExpiryMinutes() { return foRefreshExpiry / 60_000; }

    /** 만료된 토큰 포함하여 클레임 파싱 (refresh 엔드포인트용) */
    public Claims getClaimsAllowExpired(String token) {
        try {
            return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
        } catch (ExpiredJwtException e) {
            return e.getClaims();
        }
    }

    public boolean validate(String token) {
        try {
            Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired: {}", e.getMessage());
        } catch (JwtException e) {
            log.warn("JWT invalid: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("JWT validation error: {}", e.getMessage());
        }
        return false;
    }

    public Claims getClaims(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload();
    }

    public String getAuthId(String token) {
        return getClaims(token).getSubject();
    }

    /** @deprecated use {@link #getAuthId(String)} */
    @Deprecated
    public String getUserId(String token) {
        return getAuthId(token);
    }

    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }

    public String getUserTypeCd(String token) {
        return getClaims(token).get("userTypeCd", String.class);
    }

    public String getRoleId(String token) {
        return getClaims(token).get("roleId", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        return getClaims(token).get("roles", List.class);
    }

    public String getLoginId(String token) {
        return getClaims(token).get("loginId", String.class);
    }

    public String getVendorId(String token) {
        return getClaims(token).get("vendorId", String.class);
    }

    public String getSiteId(String token) {
        return getClaims(token).get("siteId", String.class);
    }

    public String getMemberId(String token) {
        return getClaims(token).get("memberId", String.class);
    }

    public String getMemberGrade(String token) {
        return getClaims(token).get("memberGrade", String.class);
    }

    public String getIsStaffYn(String token) {
        return getClaims(token).get("isStaffYn", String.class);
    }

    public String getIsAdminYn(String token) {
        return getClaims(token).get("isAdminYn", String.class);
    }
}
