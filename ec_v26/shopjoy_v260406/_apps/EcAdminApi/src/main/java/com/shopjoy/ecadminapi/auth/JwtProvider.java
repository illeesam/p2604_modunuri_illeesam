package com.shopjoy.ecadminapi.auth;

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

    public String createAccessToken(String userId, String loginId, List<String> roles) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + accessExpiry);

        return Jwts.builder()
            .subject(userId)
            .claim("loginId", loginId)
            .claim("roles", roles)
            .claim("type", "access")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
    }

    public String createRefreshToken(String userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + refreshExpiry);

        return Jwts.builder()
            .subject(userId)
            .claim("type", "refresh")
            .issuedAt(now)
            .expiration(expiry)
            .signWith(secretKey)
            .compact();
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

    public String getUserId(String token) {
        return getClaims(token).getSubject();
    }

    public String getTokenType(String token) {
        return getClaims(token).get("type", String.class);
    }

    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        return getClaims(token).get("roles", List.class);
    }
}
