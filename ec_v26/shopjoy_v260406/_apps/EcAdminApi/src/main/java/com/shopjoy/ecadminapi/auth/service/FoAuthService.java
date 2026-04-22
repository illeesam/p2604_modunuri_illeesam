package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.auth.data.dto.AccessTokenClaims;
import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.FoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.LoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.LoginRes;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class FoAuthService {

    private static final DateTimeFormatter ID_FMT = DateTimeFormatter.ofPattern("yyMMddHHmmss");

    private final MbMemberRepository memberRepository;
    private final JwtProvider         jwtProvider;
    private final PasswordEncoder     passwordEncoder;

    private final Set<String> revokedTokens = ConcurrentHashMap.newKeySet();

    @Transactional
    public LoginRes login(LoginReq request) {
        MbMember member = memberRepository.findByLoginId(request.getLoginId())
                .orElseThrow(() -> new CmBizException("회원 로그인ID가 올바르지 않습니다."));

        if (!"ACTIVE".equals(member.getMemberStatusCd())) {
            throw new CmBizException("비활성화된 계정입니다.");
        }

        // 클라이언트에서 SHA256 해시된 비밀번호를 받아 BCrypt로 재해시하여 검증
        if (!passwordEncoder.matches(request.getLoginPwd(), member.getLoginPwdHash())) {
            throw new CmBizException("로그인 ID 또는 비밀번호가 올바르지 않습니다.");
        }

        LocalDateTime loginAt = LocalDateTime.now();
        member.setLastLogin(loginAt);

        String accessToken  = jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .userId(member.getMemberId())
                .loginId(member.getLoginId())
                .roles(List.of("ROLE_MEMBER"))
                .userType(AuthPrincipal.FO)
                .roleId(null)
                .vendorId(null)
                .siteId(CmUtil.nvl(member.getSiteId()))
                .memberId(member.getMemberId())
                .memberGrade(CmUtil.nvl(member.getGradeCd()))
                .isStaffYn("N")
                .isAdminYn("N")
                .build()
        );
        String refreshToken = jwtProvider.createRefreshToken(member.getMemberId(), AuthPrincipal.FO);

        return LoginRes.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(member.getMemberId())
                .siteId(CmUtil.nvl(member.getSiteId()))
                .userTypeCd(AuthPrincipal.FO)
                .build();
    }

    @Transactional
    public FoJoinRes join(MbMember body) {
        if (memberRepository.findByLoginId(body.getLoginId()).isPresent()) {
            throw new CmBizException("이미 사용 중인 로그인 ID입니다.");
        }

        String newId = "MB" + LocalDateTime.now().format(ID_FMT)
                + String.format("%04d", (int) (Math.random() * 10000));

        body.setMemberId(newId);
        body.setLoginPwdHash(passwordEncoder.encode(body.getLoginPwdHash()));
        body.setMemberStatusCd("ACTIVE");
        body.setJoinDate(LocalDateTime.now());
        body.setRegBy(newId);
        body.setRegDate(LocalDateTime.now());

        memberRepository.save(body);

        return new FoJoinRes(newId, body.getLoginId());
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken) {
        if (revokedTokens.contains(refreshToken))
            throw new CmBizException("이미 무효화된 토큰입니다.");
        if (!jwtProvider.validate(refreshToken))
            throw new CmBizException("유효하지 않거나 만료된 refreshToken입니다.");
        if (!"refresh".equals(jwtProvider.getTokenType(refreshToken)))
            throw new CmBizException("refreshToken이 아닙니다.");
        if (!AuthPrincipal.FO.equals(jwtProvider.getUserType(refreshToken)))
            throw new CmBizException("회원 토큰이 아닙니다.");

        String memberId = jwtProvider.getUserId(refreshToken);
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        revokedTokens.add(refreshToken);

        String newAccess  = jwtProvider.createAccessToken(
            AccessTokenClaims.builder()
                .userId(memberId)
                .loginId(member.getLoginId())
                .roles(List.of("ROLE_MEMBER"))
                .userType(AuthPrincipal.FO)
                .roleId(null)
                .vendorId(null)
                .siteId(CmUtil.nvl(member.getSiteId()))
                .memberId(member.getMemberId())
                .memberGrade(CmUtil.nvl(member.getGradeCd()))
                .isStaffYn("N")
                .isAdminYn("N")
                .build()
        );
        String newRefresh = jwtProvider.createRefreshToken(memberId, AuthPrincipal.FO);

        return new TokenPair(newAccess, newRefresh,
                LocalDateTime.now(), jwtProvider.getAccessExpiryMinutes(), jwtProvider.getRefreshExpiryMinutes());
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            revokedTokens.add(refreshToken);
        }
    }

    @Transactional(readOnly = true)
    public LoginRes getCurrentUserInfo() {
        String memberId = SecurityContextHolder.getContext().getAuthentication().getName();
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        return LoginRes.builder()
                .userId(member.getMemberId())
                .siteId(CmUtil.nvl(member.getSiteId()))
                .userTypeCd(AuthPrincipal.FO)
                .build();
    }
}
