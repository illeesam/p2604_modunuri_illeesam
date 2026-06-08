package com.shopjoy.ecadminapi.co.auth.service;

import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMemberSns;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberLoginLog;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbhMemberTokenLog;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberSnsRepository;
import com.shopjoy.ecadminapi.co.auth.data.dto.AccessTokenClaims;
import com.shopjoy.ecadminapi.co.auth.data.dto.SocialUserInfo;
import com.shopjoy.ecadminapi.co.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.co.auth.data.vo.SocialLoginReq;
import com.shopjoy.ecadminapi.co.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * 소셜 로그인 서비스 (정석: 토큰검증 + 회원매칭 + JWT 발급).
 *
 * <p>흐름(loginSocial):</p>
 * <ol>
 *   <li>provider accessToken을 {@link SocialTokenVerifier}로 userinfo 검증 → SNS 사용자ID 확보</li>
 *   <li>(siteId, snsChannelCd, snsUserId)로 mb_member_sns 매칭 → 회원(mb_member) 조회</li>
 *   <li>없으면 mb_member 신규가입 + mb_member_sns 연동행 생성 (소셜 비밀번호 없음)</li>
 *   <li>FoAuthService.login 4~6단계 동일 적용: buildAccessToken / createRefreshToken /
 *       saveTokenLog(멀티디바이스 행추가) / saveLoginLog / LoginRes.builder</li>
 * </ol>
 *
 * <p>BO/FO 구분은 appTypeCd 인자로만 전달(기존 패턴). appTypeCd는 JWT 만료시간 결정에 사용된다
 * (JwtProvider: "BO"=BO만료, 그 외=FO만료). 회원 매칭/저장 로직은 양쪽 동일하게 mb_member 기준.</p>
 *
 * <p>설계 메모: FoAuthService의 buildAccessToken/saveTokenLog/saveLoginLog가 private이라
 * 재사용할 수 없어 동일 로직을 본 서비스에 복제했다(기존 인증 서비스 무변경, 변경 위험 최소화).</p>
 *
 * <p>refreshToken은 DB(mbh_member_token_log)에만 보관하고 클라이언트에 미전달(LoginRes.refreshToken=null).</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SocialAuthService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    @PersistenceContext
    private EntityManager em;

    private final MbMemberRepository    memberRepository;
    private final MbMemberSnsRepository memberSnsRepository;
    private final SocialTokenVerifier   socialTokenVerifier;
    private final JwtProvider           jwtProvider;
    private final PasswordEncoder       passwordEncoder;

    /** siteId 미전달 시 사용할 기본 사이트 (대표 사이트). */
    @Value("${auth.social.default-site-id:SITE000001}")
    private String defaultSiteId;

    // ── loginSocial ───────────────────────────────────────────────────────

    /* loginSocial — 소셜 로그인 (검증 → 매칭/가입 → JWT) */
    @Transactional
    public LoginRes loginSocial(SocialLoginReq request, String appTypeCd) {
        // 1) provider accessToken 검증 → SNS 사용자정보
        SocialUserInfo info = socialTokenVerifier.verify(request.getProvider(), request.getAccessToken());

        String siteId = CmUtil.nvl(request.getSiteId(), defaultSiteId);

        // 2) (siteId, snsChannelCd, snsUserId) 매칭 → 기존 연동 회원 조회
        MbMember member;
        Optional<MbMemberSns> snsOpt = memberSnsRepository
            .findBySiteIdAndSnsChannelCdAndSnsUserId(siteId, info.getSnsChannelCd(), info.getSnsUserId());

        if (snsOpt.isPresent()) {
            String memberId = snsOpt.get().getMemberId();
            member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException(
                    "연동된 회원 정보를 찾을 수 없습니다. 관리자에게 문의해주세요." + "::" + CmUtil.svcCallerInfo(this)));
        } else {
            // 3) 신규가입 (회원 + SNS 연동행 생성)
            member = joinSocialMember(info, request, siteId);
        }

        // 상태 검증
        if (!"ACTIVE".equals(member.getMemberStatusCd())) {
            saveLoginLog(member.getMemberId(), CmUtil.nvl(member.getSiteId()),
                member.getLoginId(), "FAIL", null, 0, null, null);
            throw new CmBizException("비활성화된 계정입니다." + "::" + CmUtil.svcCallerInfo(this));
        }

        member.setLastLogin(LocalDateTime.now());

        // 4~6) JWT 발급 + 토큰/로그인 이력 기록 + 응답 구성 (FoAuthService.login 동일 흐름)
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
            .userEmail(member.getLoginId())
            .userPhone(member.getMemberPhone())
            .siteId(CmUtil.nvl(member.getSiteId()))
            .appTypeCd(appTypeCd)
            .roleId("")
            .deptId("")
            .build();
    }

    // ── join (social) ───────────────────────────────────────────────────────

    /**
     * 소셜 신규가입 — mb_member + mb_member_sns 생성.
     *
     * <p>loginId(이메일)는 검증 이메일 우선, 없으면 클라이언트 보조값, 그래도 없으면
     * 제공자+사용자ID 기반 합성값을 사용(NOT NULL 컬럼 보장). 소셜 회원은 비밀번호로
     * 직접 로그인하지 않으므로 추측 불가능한 랜덤 비밀번호를 bcrypt로 저장한다.</p>
     */
    private MbMember joinSocialMember(SocialUserInfo info, SocialLoginReq request, String siteId) {
        String now = LocalDateTime.now().format(ID_FMT);
        String memberId    = "MB" + now + String.format("%04d", (int)(Math.random() * 10000));
        String memberSnsId = "MS" + now + String.format("%04d", (int)(Math.random() * 10000));

        // loginId(이메일) 결정: 검증값 → 클라이언트 보조값 → 합성값
        String email = CmUtil.nvl(info.getEmail(), CmUtil.nvl(request.getEmail()));
        String loginId = (email == null || email.isBlank())
            ? (info.getSnsChannelCd().toLowerCase() + "_" + info.getSnsUserId() + "@social.local")
            : email;

        // loginId 중복 시: 이미 같은 이메일로 일반 가입된 회원이 있으면 그 회원에 SNS 연동만 추가
        Optional<MbMember> existing = memberRepository.findByLoginId(loginId);
        if (existing.isPresent()) {
            MbMember exist = existing.get();
            createSnsLink(memberSnsId, exist.getSiteId() != null ? exist.getSiteId() : siteId,
                exist.getMemberId(), info);
            return exist;
        }

        String memberNm = CmUtil.nvl(info.getName(), CmUtil.nvl(request.getName(), "소셜회원"));

        MbMember member = new MbMember();
        member.setMemberId(memberId);
        member.setSiteId(siteId);
        member.setLoginId(loginId);
        // 소셜 회원: 비밀번호 직접 로그인 불가 → 추측 불가능한 랜덤값 bcrypt 저장
        member.setLoginPwdHash(passwordEncoder.encode("SOCIAL$" + UUID.randomUUID()));
        member.setMemberNm(memberNm);
        member.setMemberPhone(CmUtil.nvl(info.getPhone(), CmUtil.nvl(request.getPhone())));
        member.setMemberStatusCd("ACTIVE");
        member.setJoinDate(LocalDateTime.now());
        member.setRegBy(memberId);
        member.setRegDate(LocalDateTime.now());
        member.setUpdBy(memberId);
        member.setUpdDate(LocalDateTime.now());
        memberRepository.save(member);

        // SNS 연동행 생성
        createSnsLink(memberSnsId, siteId, memberId, info);

        return member;
    }

    /** mb_member_sns 연동행 생성. */
    private void createSnsLink(String memberSnsId, String siteId, String memberId, SocialUserInfo info) {
        MbMemberSns sns = new MbMemberSns();
        sns.setMemberSnsId(memberSnsId);
        sns.setSiteId(siteId);
        sns.setMemberId(memberId);
        sns.setSnsChannelCd(info.getSnsChannelCd());
        sns.setSnsUserId(info.getSnsUserId());
        sns.setRegBy(memberId);
        sns.setRegDate(LocalDateTime.now());
        sns.setUpdBy(memberId);
        sns.setUpdDate(LocalDateTime.now());
        memberSnsRepository.save(sns);
    }

    // ── private (FoAuthService 동일 로직 복제) ──────────────────────────────

    /* buildAccessToken — FO 회원 access token (FoAuthService 동일) */
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

    /** mbh_member_token_log INSERT (FoAuthService 동일). */
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

    /** mbh_member_login_log INSERT (FoAuthService 동일). */
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
