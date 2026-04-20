package com.shopjoy.ecadminapi.auth.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * JWT 인증 필터.
 *
 * 기존 UserDetailsService.loadUserByUsername() 방식 대비 개선점:
 * - 매 요청마다 DB를 조회하지 않고 JWT 클레임(userId, userType, roles)만으로 AuthPrincipal을 구성한다.
 * - 두 사용자 테이블(sy_user / ec_member)을 단일 필터에서 처리할 수 있다.
 *   userType 클레임 값으로 어느 테이블 사용자인지 구분하며, 필터는 테이블을 알 필요가 없다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtProvider jwtProvider;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String token = extractToken(request);

        if (StringUtils.hasText(token) && jwtProvider.validate(token)) {
            String tokenType = jwtProvider.getTokenType(token);
            if ("access".equals(tokenType)) {
                try {
                    Claims claims   = jwtProvider.getClaims(token);
                    String userId   = claims.getSubject();
                    String userType = claims.get("userType", String.class);
                    String roleId   = claims.get("roleId", String.class);

                    AuthPrincipal principal = new AuthPrincipal(userId, userType, roleId);

                    @SuppressWarnings("unchecked")
                    List<String> roles = claims.get("roles", List.class);
                    List<SimpleGrantedAuthority> authorities = roles == null ? List.of() :
                        roles.stream().map(SimpleGrantedAuthority::new).toList();

                    UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(principal, null, authorities);
                    auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                    SecurityContextHolder.getContext().setAuthentication(auth);
                } catch (Exception e) {
                    log.warn("Failed to build principal from token: {}", e.getMessage());
                }
            }
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
