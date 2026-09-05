package com.shopjoy.ecBeCdn.auth.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Authorization: Bearer &lt;accessToken&gt; 검증 필터. 성공하면 principal=clientId 로 인증 컨텍스트를
 * 채운다. 토큰이 없거나 무효해도 여기서 막지 않고 그냥 통과시킨다 — 공개 경로(정적 서빙)는
 * 애초에 인증이 필요 없고, 보호 경로는 SecurityConfig 의 authenticated() 가 이어서 401 처리한다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class CfTokenAuthFilter extends OncePerRequestFilter {

    private final CfJwtProvider cfJwtProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String header = request.getHeader("Authorization");
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (cfJwtProvider.validate(token) && "access".equals(cfJwtProvider.getTokenType(token))) {
                String clientId = cfJwtProvider.getClientId(token);
                var authToken = new UsernamePasswordAuthenticationToken(
                    clientId, null, List.of(new SimpleGrantedAuthority("ROLE_CLIENT")));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            } else {
                log.debug("[CfTokenAuthFilter] accessToken 무효/만료 — uri={}", request.getRequestURI());
            }
        }
        chain.doFilter(request, response);
    }
}
