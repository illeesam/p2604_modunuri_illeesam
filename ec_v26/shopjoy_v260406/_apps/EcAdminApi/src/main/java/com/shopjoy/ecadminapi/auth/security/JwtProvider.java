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
    private final long refreshExpiry;

    public JwtProvider(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-expiry}") long accessExpiry,
            @Value("${jwt.refresh-expiry}") long refreshExpiry) {
        this.secretKey = Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
        this.accessExpiry = accessExpiry;
        this.refreshExpiry = refreshExpiry;
    }

    /**
     * Access Token 생성 (DTO 사용).
     * JWT 클레임에 AuthPrincipal 구성에 필요한 모든 정보를 포함시켜
     * JwtAuthFilter에서 DB 없이 AuthPrincipal을 완벽하게 복원할 수 있게 한다.
     */
    public String createAccessToken(AccessTokenClaims claims) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpiry);

        return Jwts.builder()
            .subject(claims.getUserId())
            .claim("loginId", claims.getLoginId())
            .claim("roles", claims.getRoles())
            .claim("type", "access")
            .claim("userType", claims.getUserType())
            .claim("roleId", claims.getRoleId())
            .claim("vendorId", claims.getVendorId())
            .claim("siteId", claims.getSiteId())
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
     * Refresh Token 생성.
     * userType을 포함시켜 재발급 시 원래 사용자 타입을 유지한다.
     * 재발급 엔드포인트에서 DB로 userType을 재조회하지 않아도 되도록 설계.
     */
    public String createRefreshToken(String userId, String userType) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpiry);

        return Jwts.builder()
            .subject(userId)
            .claim("type", "refresh")
            .claim("userType", userType)
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    public long getAccessExpiryMinutes()  { return accessExpiry  / 60_000; }
    public long getRefreshExpiryMinutes() { return refreshExpiry / 60_000; }

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

    public String getUserId(String token) {
        return getClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }

    public String getUserType(String token) {
        return getClaims(token).get("userType", String.class);
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
