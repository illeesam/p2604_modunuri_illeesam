package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.auth.data.dto.AccessTokenClaims;
import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.BoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
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
    public BoJoinRes join(SyUser body, String userTypeCd) {
        boolean exists = em.createQuery(
                "SELECT COUNT(u) FROM SyUser u WHERE u.loginId = :loginId", Long.class)
            .setParameter("loginId", body.getLoginId())
            .getSingleResult() > 0;
        if (exists) throw new CmBizException("이미 사용 중인 아이디입니다.");

        body.setUserId("US" + LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyMMddHHmmss"))
            + String.format("%04d", (int)(Math.random() * 10000)));
        body.setLoginPwdHash(passwordEncoder.encode(body.getLoginPwdHash()));
        body.setUserStatusCd("ACTIVE");
        body.setRegDate(LocalDateTime.now());
        em.persist(body);
        return new BoJoinRes(body.getUserId(), body.getLoginId());
    }

    @Transactional
    public LoginRes login(LoginReq request, String userTypeCd) {
        SyUser user;
        try {
            user = em.createQuery(
                "SELECT u FROM SyUser u WHERE u.loginId = :loginId", SyUser.class)
                .setParameter("loginId", request.getLoginId())
                .getSingleResult();
        } catch (NoResultException e) {
            throw new CmBizException("사용자 로그인ID가 올바르지 않습니다.");
        }

        if (!"ACTIVE".equals(user.getUserStatusCd())) {
            throw new CmBizException("비활성화된 계정입니다.");
        }

        // 클라이언트에서 SHA256 해시된 비밀번호를 받아 BCrypt로 재해시하여 검증
        if (!passwordEncoder.matches(request.getLoginPwd(), user.getLoginPwdHash())) {
            user.setLoginFailCnt(user.getLoginFailCnt() == null ? 1 : user.getLoginFailCnt() + 1);
            throw new CmBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        user.setLoginFailCnt(0);
        LocalDateTime loginAt = LocalDateTime.now();
        user.setLastLoginDate(loginAt);

        String authId = user.getUserId();   // BO: authId = sy_user.user_id
        List<String> roles = List.of("ROLE_ADMIN");
        String accessToken = jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .authId(authId)
                .loginId(user.getLoginId())
                .roles(roles)
                .userTypeCd(userTypeCd)
                .roleId(user.getRoleId())
                .vendorId(null)
                .siteId(user.getSiteId())
                .userId(authId)             // BO 전용: sy_user.user_id
                .memberId(null)             // FO 전용: BO는 null
                .memberGrade(null)
                .isStaffYn("N")
                .isAdminYn("N")
                .build()
        );
        String refreshToken = jwtProvider.createRefreshToken(authId, userTypeCd);

        return LoginRes.builder()
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .authId(authId)
            .userId(authId)             // BO 전용
            .memberId(null)             // FO 전용: BO는 null
            .userNm(user.getUserNm())
            .siteId(user.getSiteId())
            .roleId(user.getRoleId())
            .userTypeCd(userTypeCd)
            .deptId("")
            .build();
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken, String userTypeCd) {
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

        String authId      = jwtProvider.getAuthId(refreshToken);
        String _userTypeCd = jwtProvider.getUserTypeCd(refreshToken);
        SyUser user = em.find(SyUser.class, authId);
        if (user == null) {
            throw new CmBizException("사용자를 찾을 수 없습니다.");
        }

        revokedTokens.add(refreshToken);

        List<String> roles = List.of("ROLE_ADMIN");
        String newAccessToken = jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .authId(authId)
                .loginId(user.getLoginId())
                .roles(roles)
                .userTypeCd(userTypeCd)
                .roleId(user.getRoleId())
                .vendorId(null)
                .siteId(user.getSiteId())
                .userId(authId)
                .memberId(null)
                .memberGrade(null)
                .isStaffYn("N")
                .isAdminYn("Y")
                .build()
        );
        String newRefreshToken = jwtProvider.createRefreshToken(authId, userTypeCd);

        return new TokenPair(newAccessToken, newRefreshToken,
                LocalDateTime.now(), jwtProvider.getAccessExpiryMinutes(), jwtProvider.getRefreshExpiryMinutes());
    }

    public void logout(String refreshToken, String userTypeCd) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            revokedTokens.add(refreshToken);
        }
    }

    @Transactional(readOnly = true)
    public LoginRes getCurrentUserInfo(String userTypeCd) {
        String authId = SecurityContextHolder.getContext().getAuthentication().getName();
        SyUser user = em.find(SyUser.class, authId);
        if (user == null) {
            throw new CmBizException("사용자를 찾을 수 없습니다.");
        }

        return LoginRes.builder()
            .authId(authId)
            .userId(authId)
            .memberId(null)
            .userNm(user.getUserNm())
            .siteId(user.getSiteId())
            .roleId(user.getRoleId())
            .userTypeCd(userTypeCd)
            .deptId("")
            .build();
    }

}
