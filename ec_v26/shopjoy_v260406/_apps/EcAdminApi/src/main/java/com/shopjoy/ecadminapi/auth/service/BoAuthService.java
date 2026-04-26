package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.auth.data.dto.AccessTokenClaims;
import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.BoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserLoginLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhUserTokenLog;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyUser;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import io.jsonwebtoken.Claims;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * BO 관리자 인증 서비스
 * - 1세션 정책: 로그인 시 기존 syh_user_token_log 행 삭제 후 신규 발급
 * - refreshToken은 DB에만 보관, 클라이언트에 미전달
 * - refresh: 만료된 accessToken(Authorization 헤더) → DB에서 refreshToken 조회 → 신규 토큰 쌍 발급
 * - 로그인 성공/실패 모두 syh_user_login_log에 기록
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BoAuthService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    @PersistenceContext
    private EntityManager em;

    private final JwtProvider     jwtProvider;
    private final PasswordEncoder passwordEncoder;

    // ── join ──────────────────────────────────────────────────────────────

    @Transactional
    public BoJoinRes join(SyUser body, String userTypeCd) {
        boolean exists = em.createQuery(
                "SELECT COUNT(u) FROM SyUser u WHERE u.loginId = :loginId", Long.class)
            .setParameter("loginId", body.getLoginId())
            .getSingleResult() > 0;
        if (exists) throw new CmBizException("이미 사용 중인 아이디입니다.");

        body.setUserId("US" + LocalDateTime.now().format(ID_FMT)
            + String.format("%04d", (int)(Math.random() * 10000)));
        body.setLoginPwdHash(passwordEncoder.encode(body.getLoginPwdHash()));
        body.setUserStatusCd("ACTIVE");
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        em.persist(body);
        return new BoJoinRes(body.getUserId(), body.getLoginId());
    }

    // ── login ─────────────────────────────────────────────────────────────

    @Transactional
    public LoginRes login(LoginReq request, String userTypeCd) {
        SyUser user;
        try {
            user = em.createQuery(
                    "SELECT u FROM SyUser u WHERE u.loginId = :loginId", SyUser.class)
                .setParameter("loginId", request.getLoginId())
                .getSingleResult();
        } catch (NoResultException e) {
            saveLoginLog(null, null, request.getLoginId(), "FAIL", null, null, 0);
            throw new CmBizException("사용자 로그인ID가 올바르지 않습니다.");
        }

        if (!"ACTIVE".equals(user.getUserStatusCd())) {
            saveLoginLog(user.getUserId(), user.getSiteId(), user.getLoginId(), "FAIL", null, null,
                user.getLoginFailCnt() == null ? 0 : user.getLoginFailCnt());
            throw new CmBizException("비활성화된 계정입니다.");
        }

        if (!passwordEncoder.matches(request.getLoginPwd(), user.getLoginPwdHash())) {
            int failCnt = user.getLoginFailCnt() == null ? 1 : user.getLoginFailCnt() + 1;
            user.setLoginFailCnt(failCnt);
            saveLoginLog(user.getUserId(), user.getSiteId(), user.getLoginId(), "FAIL", null, null, failCnt);
            throw new CmBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        user.setLoginFailCnt(0);
        user.setLastLoginDate(LocalDateTime.now());

        String authId = user.getUserId();

        // 1세션: 기존 토큰 로그 삭제
        em.createQuery(
                "DELETE FROM SyhUserTokenLog t WHERE t.authId = :authId")
            .setParameter("authId", authId)
            .executeUpdate();

        String accessToken  = buildAccessToken(user, userTypeCd);
        String refreshToken = jwtProvider.createRefreshToken(authId, userTypeCd);

        // refreshToken DB 저장
        String tokenLogId = saveTokenLog(authId, user.getSiteId(), accessToken, refreshToken, "LOGIN", userTypeCd);

        // 로그인 성공 이력 기록
        saveLoginLog(authId, user.getSiteId(), user.getLoginId(), "SUCCESS", accessToken, tokenLogId, 0);

        return LoginRes.builder()
            .accessToken(accessToken)
            .refreshToken(null)
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

    // ── refresh ───────────────────────────────────────────────────────────

    @Transactional
    public TokenPair refresh(String expiredAccessToken, String userTypeCd) {
        if (expiredAccessToken == null || expiredAccessToken.isBlank()) {
            throw new CmBizException("accessToken이 필요합니다.");
        }

        Claims claims;
        try {
            claims = jwtProvider.getClaimsAllowExpired(expiredAccessToken);
        } catch (Exception e) {
            throw new CmBizException("유효하지 않은 accessToken입니다.");
        }
        String authId = claims.getSubject();
        if (authId == null || authId.isBlank()) {
            throw new CmBizException("토큰에서 사용자 정보를 확인할 수 없습니다.");
        }

        SyhUserTokenLog tokenLog;
        try {
            tokenLog = em.createQuery(
                    "SELECT t FROM SyhUserTokenLog t WHERE t.authId = :authId AND t.accessToken = :accessToken",
                    SyhUserTokenLog.class)
                .setParameter("authId", authId)
                .setParameter("accessToken", expiredAccessToken)
                .getSingleResult();
        } catch (NoResultException e) {
            throw new CmBizException("로그인 세션을 찾을 수 없습니다. 다시 로그인해주세요.");
        }

        String storedRefreshToken = tokenLog.getRefreshToken();
        if (storedRefreshToken == null || storedRefreshToken.isBlank()) {
            throw new CmBizException("저장된 refreshToken이 없습니다. 다시 로그인해주세요.");
        }

        if (!jwtProvider.validate(storedRefreshToken)) {
            em.remove(tokenLog);
            throw new CmBizException("refreshToken이 만료되었습니다. 다시 로그인해주세요.");
        }

        SyUser user = em.find(SyUser.class, authId);
        if (user == null) throw new CmBizException("사용자를 찾을 수 없습니다.");

        String newAccessToken  = buildAccessToken(user, userTypeCd);
        String newRefreshToken = jwtProvider.createRefreshToken(authId, userTypeCd);

        tokenLog.setPrevToken(tokenLog.getAccessToken());
        tokenLog.setAccessToken(newAccessToken);
        tokenLog.setRefreshToken(newRefreshToken);
        tokenLog.setActionCd("REFRESH");
        tokenLog.setUpdBy(authId);
        tokenLog.setUpdDate(LocalDateTime.now());

        return new TokenPair(newAccessToken, null,
            LocalDateTime.now(),
            jwtProvider.getBoAccessExpiryMinutes(),
            jwtProvider.getBoRefreshExpiryMinutes());
    }

    // ── logout ────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, String userTypeCd) {
        if (accessToken == null || accessToken.isBlank()) return;
        try {
            Claims claims = jwtProvider.getClaimsAllowExpired(accessToken);
            String authId = claims.getSubject();
            if (authId != null) {
                em.createQuery(
                        "DELETE FROM SyhUserTokenLog t WHERE t.authId = :authId")
                    .setParameter("authId", authId)
                    .executeUpdate();
            }
        } catch (Exception e) {
            log.warn("logout token parse error: {}", e.getMessage());
        }
    }

    // ── private ───────────────────────────────────────────────────────────

    private String buildAccessToken(SyUser user, String userTypeCd) {
        return jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .authId(user.getUserId())
                .loginId(user.getLoginId())
                .roles(List.of("BO_GUEST"))
                .userTypeCd(userTypeCd)
                .roleId(user.getRoleId())
                .vendorId(null)
                .siteId(user.getSiteId())
                .userId(user.getUserId())
                .memberId(null)
                .memberGrade(null)
                .isStaffYn("N")
                .isAdminYn("N")
                .build()
        );
    }

    /** syh_user_token_log INSERT, logId 반환 */
    private String saveTokenLog(String authId, String siteId,
                                String accessToken, String refreshToken,
                                String actionCd, String userTypeCd) {
        String logId = "TL" + LocalDateTime.now().format(ID_FMT)
            + String.format("%04d", (int)(Math.random() * 10000));
        SyhUserTokenLog tokenLog = SyhUserTokenLog.builder()
            .logId(logId)
            .siteId(siteId)
            .authId(authId)
            .userId(authId)
            .actionCd(actionCd)
            .tokenTypeCd(userTypeCd)
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .tokenExp(LocalDateTime.now().plusMinutes(jwtProvider.getBoRefreshExpiryMinutes()))
            .regBy(authId)
            .regDate(LocalDateTime.now())
            .build();
        em.persist(tokenLog);
        return logId;
    }

    /** syh_user_login_log INSERT (성공/실패 모두) */
    private void saveLoginLog(String userId, String siteId, String loginId,
                              String resultCd, String accessToken, String loginLogId, int failCnt) {
        try {
            String logId = "LL" + LocalDateTime.now().format(ID_FMT)
                + String.format("%04d", (int)(Math.random() * 10000));
            SyhUserLoginLog loginLog = SyhUserLoginLog.builder()
                .logId(logId)
                .siteId(siteId)
                .authId(userId)
                .userId(userId)
                .loginId(loginId)
                .loginDate(LocalDateTime.now())
                .resultCd(resultCd)
                .failCnt(failCnt)
                .accessToken(accessToken)
                .accessTokenExp(accessToken != null
                    ? LocalDateTime.now().plusMinutes(jwtProvider.getBoAccessExpiryMinutes()) : null)
                .regBy(userId)
                .regDate(LocalDateTime.now())
                .build();
            em.persist(loginLog);
        } catch (Exception e) {
            log.warn("saveLoginLog error: {}", e.getMessage());
        }
    }
}
