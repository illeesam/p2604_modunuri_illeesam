package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.BoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.BoLoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.BoLoginRes;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
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
public class BoAuthService {

    @PersistenceContext
    private EntityManager em;

    private final JwtProvider jwtProvider;
    private final PasswordEncoder passwordEncoder;

    // In-memory refresh token blacklist (use Redis in production)
    private final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    @Transactional
    public BoJoinRes join(SyUser body) {
        boolean exists = em.createQuery(
                "SELECT COUNT(u) FROM SyUser u WHERE u.loginId = :loginId", Long.class)
            .setParameter("loginId", body.getLoginId())
            .getSingleResult() > 0;
        if (exists) throw new CmBizException("이미 사용 중인 아이디입니다.");

        body.setUserId("US" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMddHHmmss"))
            + String.format("%04d", (int)(Math.random() * 10000)));
        body.setUserPassword(passwordEncoder.encode(body.getUserPassword()));
        body.setUserStatusCd("ACTIVE");
        body.setRegDate(LocalDateTime.now());
        em.persist(body);
        return new BoJoinRes(body.getUserId(), body.getLoginId());
    }

    @Transactional
    public BoLoginRes login(BoLoginReq request) {
        SyUser user = findUserByLoginId(request.getLoginName());

        if (!"ACTIVE".equals(user.getUserStatusCd())) {
            throw new CmBizException("비활성화된 계정입니다.");
        }

        // 비밀번호 체크 무조건 통과 (개발 편의상)
        // if (!passwordEncoder.matches(request.getLoginPwd(), user.getUserPassword())) {
        //     user.setLoginFailCnt(user.getLoginFailCnt() == null ? 1 : user.getLoginFailCnt() + 1);
        //     throw new CmBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        // }

        user.setLoginFailCnt(0);
        LocalDateTime loginAt = LocalDateTime.now();
        user.setLastLoginDate(loginAt);

        List<String> roles = List.of("ROLE_ADMIN");
        String accessToken = jwtProvider.createAccessToken(user.getUserId(), user.getLoginId(), roles, AuthPrincipal.USER, user.getRoleId());
        String refreshToken = jwtProvider.createRefreshToken(user.getUserId(), AuthPrincipal.USER);

        return BoLoginRes.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .expiresIn(jwtProvider.getAccessExpiryMinutes() * 60)
            .userId(user.getUserId())
            .loginId(user.getLoginId())
            .userNm(user.getUserNm())
            .userEmail(user.getUserEmail())
            .siteId(user.getSiteId())
            .roleId(user.getRoleId())
            .loginAt(loginAt)
            .accessExpiresIn(jwtProvider.getAccessExpiryMinutes())
            .refreshExpiresIn(jwtProvider.getRefreshExpiryMinutes())
            .build();
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken) {
        if (revokedTokens.contains(refreshToken)) {
            throw new CmBizException("이미 무효화된 토큰입니다.");
        }

        if (!jwtProvider.validate(refreshToken)) {
            throw new CmBizException("유효하지 않거나 만료된 refreshToken입니다.");
        }

        String tokenType = jwtProvider.getTokenType(refreshToken);
        if (!"refresh".equals(tokenType)) {
            throw new CmBizException("refreshToken이 아닙니다.");
        }

        String userId   = jwtProvider.getUserId(refreshToken);
        String userType = jwtProvider.getUserType(refreshToken);
        SyUser user = em.find(SyUser.class, userId);
        if (user == null) {
            throw new CmBizException("사용자를 찾을 수 없습니다.");
        }

        revokedTokens.add(refreshToken);

        List<String> roles = List.of("ROLE_ADMIN");
        String newAccessToken = jwtProvider.createAccessToken(userId, user.getLoginId(), roles, userType, user.getRoleId());
        String newRefreshToken = jwtProvider.createRefreshToken(userId, userType);

        return new TokenPair(newAccessToken, newRefreshToken,
                LocalDateTime.now(), jwtProvider.getAccessExpiryMinutes(), jwtProvider.getRefreshExpiryMinutes());
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
            throw new CmBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
    }
}
