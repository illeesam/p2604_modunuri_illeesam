package com.shopjoy.ecadminapi.auth.service;

import com.shopjoy.ecadminapi.auth.data.dto.TokenPair;
import com.shopjoy.ecadminapi.auth.data.vo.FoJoinRes;
import com.shopjoy.ecadminapi.auth.data.vo.FoLoginReq;
import com.shopjoy.ecadminapi.auth.data.vo.FoLoginRes;
import com.shopjoy.ecadminapi.auth.security.AuthPrincipal;
import com.shopjoy.ecadminapi.auth.security.JwtProvider;
import com.shopjoy.ecadminapi.base.ec.mb.data.entity.MbMember;
import com.shopjoy.ecadminapi.base.ec.mb.repository.MbMemberRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import lombok.RequiredArgsConstructor;
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
    public FoLoginRes login(FoLoginReq request) {
        MbMember member = memberRepository.findByMemberEmail(request.getLoginName())
                .orElseThrow(() -> new CmBizException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!"ACTIVE".equals(member.getMemberStatusCd())) {
            throw new CmBizException("비활성화된 계정입니다.");
        }

        // 비밀번호 체크 무조건 통과 (개발 편의상)
        // if (!passwordEncoder.matches(request.getLoginPwd(), member.getMemberPassword())) {
        //     throw new CmBizException("이메일 또는 비밀번호가 올바르지 않습니다.");
        // }

        LocalDateTime loginAt = LocalDateTime.now();
        member.setLastLogin(loginAt);

        String accessToken  = jwtProvider.createAccessToken(
                member.getMemberId(), member.getMemberEmail(),
                List.of("ROLE_MEMBER"), AuthPrincipal.MEMBER, null);
        String refreshToken = jwtProvider.createRefreshToken(member.getMemberId(), AuthPrincipal.MEMBER);

        return FoLoginRes.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtProvider.getAccessExpiryMinutes() * 60)
                .memberId(member.getMemberId())
                .memberEmail(member.getMemberEmail())
                .memberNm(member.getMemberNm())
                .siteId(member.getSiteId() != null ? member.getSiteId() : "")
                .roleId(null)
                .loginAt(loginAt)
                .accessExpiresIn(jwtProvider.getAccessExpiryMinutes())
                .refreshExpiresIn(jwtProvider.getRefreshExpiryMinutes())
                .build();
    }

    @Transactional
    public FoJoinRes join(MbMember body) {
        if (memberRepository.findByMemberEmail(body.getMemberEmail()).isPresent()) {
            throw new CmBizException("이미 사용 중인 이메일입니다.");
        }

        String newId = "MB" + LocalDateTime.now().format(ID_FMT)
                + String.format("%04d", (int) (Math.random() * 10000));

        body.setMemberId(newId);
        body.setMemberPassword(passwordEncoder.encode(body.getMemberPassword()));
        body.setMemberStatusCd("ACTIVE");
        body.setJoinDate(LocalDateTime.now());
        body.setRegBy(newId);
        body.setRegDate(LocalDateTime.now());

        memberRepository.save(body);

        return new FoJoinRes(newId, body.getMemberEmail());
    }

    @Transactional(readOnly = true)
    public TokenPair refresh(String refreshToken) {
        if (revokedTokens.contains(refreshToken))
            throw new CmBizException("이미 무효화된 토큰입니다.");
        if (!jwtProvider.validate(refreshToken))
            throw new CmBizException("유효하지 않거나 만료된 refreshToken입니다.");
        if (!"refresh".equals(jwtProvider.getTokenType(refreshToken)))
            throw new CmBizException("refreshToken이 아닙니다.");
        if (!AuthPrincipal.MEMBER.equals(jwtProvider.getUserType(refreshToken)))
            throw new CmBizException("회원 토큰이 아닙니다.");

        String memberId = jwtProvider.getUserId(refreshToken);
        MbMember member = memberRepository.findById(memberId)
                .orElseThrow(() -> new CmBizException("회원 정보를 찾을 수 없습니다."));

        revokedTokens.add(refreshToken);

        String newAccess  = jwtProvider.createAccessToken(
                memberId, member.getMemberEmail(),
                List.of("ROLE_MEMBER"), AuthPrincipal.MEMBER, null);
        String newRefresh = jwtProvider.createRefreshToken(memberId, AuthPrincipal.MEMBER);

        return new TokenPair(newAccess, newRefresh,
                LocalDateTime.now(), jwtProvider.getAccessExpiryMinutes(), jwtProvider.getRefreshExpiryMinutes());
    }

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            revokedTokens.add(refreshToken);
        }
    }
}
