package com.shopjoy.ecadminapi.auth;

import com.shopjoy.ecadminapi.auth.dto.LoginRequest;
import com.shopjoy.ecadminapi.auth.dto.LoginResponse;
import com.shopjoy.ecadminapi.auth.dto.TokenPair;
import com.shopjoy.ecadminapi.common.exception.BusinessException;
import com.shopjoy.ecadminapi.base.sy.entity.SyUser;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    @PersistenceContext
    private EntityManager em;

    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    // In-memory refresh token blacklist (use Redis in production)
    private final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    @Transactional
    public LoginResponse login(LoginRequest request) {
        SyUser user = findUserByLoginId(request.getLoginId());

        if (!"ACTIVE".equals(user.getUserStatusCd())) {
            throw new BusinessException("비활성화된 계정입니다.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getUserPassword())) {
            // Increment login fail count
            user.setLoginFailCnt(user.getLoginFailCnt() == null ? 1 : user.getLoginFailCnt() + 1);
            throw new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        // Reset fail count on success
        user.setLoginFailCnt(0);
        user.setLastLoginDate(LocalDateTime.now());

        List<String> roles = List.of("ROLE_ADMIN");
        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getLoginId(), roles, AuthPrincipal.USER, user.getRoleId());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId(), AuthPrincipal.USER);

        return LoginResponse.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(900)
            .userId(user.getUserId())
            .loginId(user.getLoginId())
            .userNm(user.getUserNm())
            .userEmail(user.getUserEmail())
            .siteId(user.getSiteId())
            .roleId(user.getRoleId())
            .build();
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken) {
        if (revokedTokens.contains(refreshToken)) {
            throw new BusinessException("이미 무효화된 토큰입니다.");
        }

        if (!jwtProvider.validate(refreshToken)) {
            throw new BusinessException("유효하지 않거나 만료된 refreshToken입니다.");
        }

        String tokenType = jwtProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new BusinessException("refreshToken이 아닙니다.");
        }

        String userId   = jwtProvider.getUserId(refreshToken);
        String userType = jwtProvider.getUserType(refreshToken);
        SyUser user = em.find(SyUser.class, userId);
        if (user == null) {
            throw new BusinessException("사용자를 찾을 수 없습니다.");
        }

        // Rotate refresh token
        revokedTokens.add(refreshToken);

        List<String> roles = List.of("ROLE_ADMIN");
        String newAccessToken = jwtProvider.createAccessToken(userId, user.getLoginId(), roles, userType, user.getRoleId());
        String newRefreshToken = jwtProvider.createRefreshToken(userId, userType);

        return new TokenPair(newAccessToken, newRefreshToken);
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            revokedTokens.add(refreshToken);
        }
    }

    private SyUser findUserByLoginId(String loginId) {
        try {
            return em.createQuery(
                "SELECT u FROM SyUser u WHERE u.loginId = :loginId", SyUser.class)
                .setParameter("loginId", loginId)
                .getSingleResult();
        } catch (NoResultException e) {
            throw new BusinessException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    }
}
