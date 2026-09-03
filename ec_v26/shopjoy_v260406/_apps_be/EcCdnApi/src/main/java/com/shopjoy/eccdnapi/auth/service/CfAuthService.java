package com.shopjoy.eccdnapi.auth.service;

import com.shopjoy.eccdnapi.auth.dto.CfTokenResponse;
import com.shopjoy.eccdnapi.auth.entity.CfClient;
import com.shopjoy.eccdnapi.auth.repository.CfClientRepository;
import com.shopjoy.eccdnapi.auth.security.CfJwtProvider;
import com.shopjoy.eccdnapi.common.exception.CfBizException;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CfAuthService {

    private final CfClientRepository cfClientRepository;
    private final PasswordEncoder passwordEncoder;
    private final CfJwtProvider cfJwtProvider;

    /** id/pwd 로 accessToken(30초)+refreshToken(7일) 발급. */
    public CfTokenResponse login(String id, String pwd) {
        CfClient client = cfClientRepository.findById(id)
            .orElseThrow(() -> new CfBizException("아이디 또는 비밀번호가 올바르지 않습니다."));
        if (!"Y".equals(client.getUseYn())) {
            throw new CfBizException("사용이 중지된 계정입니다: " + id);
        }
        if (!passwordEncoder.matches(pwd, client.getClientPwd())) {
            throw new CfBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        String accessToken = cfJwtProvider.createAccessToken(client.getClientId());
        String refreshToken = cfJwtProvider.createRefreshToken(client.getClientId());
        log.info("[CfAuthService] 로그인 성공: clientId={}", id);
        return new CfTokenResponse(accessToken, refreshToken, cfJwtProvider.getAccessExpirySeconds());
    }

    /**
     * refreshToken 으로 accessToken 재발급. refreshToken 이 만료되면 여기서 예외를 던지고,
     * 호출측(EcAdminApi 의 CfCdnApiClient)은 그러면 login() 부터 다시 시작해야 한다(요청사항).
     */
    public CfTokenResponse refresh(String refreshToken) {
        Claims claims;
        try {
            claims = cfJwtProvider.getClaims(refreshToken); // 만료면 여기서 ExpiredJwtException
        } catch (Exception e) {
            throw new CfBizException("refreshToken 이 만료되었거나 유효하지 않습니다. 재로그인이 필요합니다.");
        }
        if (!"refresh".equals(claims.get("type", String.class))) {
            throw new CfBizException("refreshToken 이 아닙니다.");
        }
        String clientId = claims.getSubject();
        CfClient client = cfClientRepository.findById(clientId)
            .orElseThrow(() -> new CfBizException("존재하지 않는 계정입니다: " + clientId));
        if (!"Y".equals(client.getUseYn())) {
            throw new CfBizException("사용이 중지된 계정입니다: " + clientId);
        }
        String accessToken = cfJwtProvider.createAccessToken(clientId);
        // refreshToken 은 회전(rotate)하지 않고 그대로 재사용 — 서버간 통신이라 탈취 위험이
        // 사용자 브라우저보다 낮고, 매번 새 refreshToken 을 관리하는 복잡도를 줄이기 위함.
        return new CfTokenResponse(accessToken, refreshToken, cfJwtProvider.getAccessExpirySeconds());
    }
}
