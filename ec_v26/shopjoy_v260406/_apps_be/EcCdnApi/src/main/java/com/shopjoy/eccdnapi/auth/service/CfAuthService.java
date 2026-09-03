package com.shopjoy.eccdnapi.auth.service;

import com.shopjoy.eccdnapi.auth.dto.CfTokenResponse;
import com.shopjoy.eccdnapi.auth.entity.CfClient;
import com.shopjoy.eccdnapi.auth.entity.CfToken;
import com.shopjoy.eccdnapi.auth.entity.CfTokenHist;
import com.shopjoy.eccdnapi.auth.redisstore.CfAuthRedisStore;
import com.shopjoy.eccdnapi.auth.repository.CfClientRepository;
import com.shopjoy.eccdnapi.auth.repository.CfTokenHistRepository;
import com.shopjoy.eccdnapi.auth.repository.CfTokenRepository;
import com.shopjoy.eccdnapi.auth.security.CfJwtProvider;
import com.shopjoy.eccdnapi.common.exception.CfBizException;
import com.shopjoy.eccdnapi.common.util.CfIdUtil;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * id/pwd 로 로그인 → accessToken(30초) 발급, accessToken 으로 재발급.
 *
 * <p>2026-09-06: cf_token(발급된 토큰)/cf_token_hist(발급 이력)에 전부 기록한다. EcAdminApi 등
 * 호출자가 여러 인스턴스일 수 있다는 전제로 BO 의 "1세션"이 아니라 FO 의 "멀티디바이스"(로그인마다
 * 행 추가, 기존 삭제 없음) 정책을 따른다 — 인스턴스 A 가 로그인해도 인스턴스 B 의 세션을 안 지운다.
 * issuedIp + requesterSystemNm(X-Caller-System 헤더) 둘 다 남겨 "어느 서비스의 어느 인스턴스"인지
 * 구분한다(마이크로서비스 환경 대비, 요청사항).</p>
 *
 * <p>2026-09-06 추가: cf_token_hist 에 실패 이력도 남긴다(요청사항 — "실패 이력도 넣어줘 결과내용
 * 항목 추가해줘"). 실패 로깅(fnLogFail)은 바깥 트랜잭션(login/refresh)이 이후 rollback 되더라도
 * 이력만은 반드시 남아야 하므로 REQUIRES_NEW 로 별도 트랜잭션에 커밋한다.</p>
 *
 * <p>2026-09-06 추가: Redis 인증 캐시 연동(요청사항 — "redis 인증 연동해줘 단 redis switch
 * 될수 있게 해줘"). {@link CfAuthRedisStore} 를 통해 세션 정보를 캐시하고, 강제폐기(revoke)
 * 시 accessToken 을 블랙리스트에 올려 refresh() 진입 즉시 거절한다. DB(cf_token)가 항상
 * source of truth 이고 이 캐시는 조회 편의/즉시무효화용일 뿐이라, app.redis.enabled=false
 * (스위치 꺼짐)여도 로그인/재발급/강제폐기 전부 기존과 동일하게 정상 동작한다.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CfAuthService {

    private static final String REASON_NEW = "최초 로그인";
    private static final String REASON_REFRESH = "accessToken 만료로 재발급";
    private static final String RESULT_SUCCESS = "SUCCESS";

    private final CfClientRepository cfClientRepository;
    private final CfTokenRepository cfTokenRepository;
    private final CfTokenHistRepository cfTokenHistRepository;
    private final PasswordEncoder passwordEncoder;
    private final CfJwtProvider cfJwtProvider;
    /** 실패 이력 기록 전용 별도 빈 — 반드시 DI 로 주입받아 외부 빈 호출로 거쳐야
     *  @Transactional(REQUIRES_NEW) 가 실제로 새 트랜잭션을 연다(자기자신 호출 시 프록시 우회되는
     *  Spring self-invocation 문제 회피 — 클래스 상단 주석 및 CfTokenHistFailLogger 클래스 주석 참조). */
    private final CfTokenHistFailLogger cfTokenHistFailLogger;
    /** 인증 세션 캐시(요청사항: "redis 인증 연동해줘 단 redis switch 될수 있게 해줘") — DB(cf_token)
     *  가 항상 source of truth 이고, 이건 조회 편의용 캐시 + 강제폐기 즉시무효화(blacklist) 용도일
     *  뿐이라 app.redis.enabled=false(스위치 꺼짐) 여도 아래 로직 전체가 그대로 정상 동작한다. */
    private final CfAuthRedisStore cfAuthRedisStore;

    /** id/pwd 로 accessToken(30초)+refreshToken(7일, 서버 보관) 발급. */
    @Transactional
    public CfTokenResponse login(String id, String pwd, String callerIp, String callerSystem) {
        CfClient client = cfClientRepository.findById(id).orElse(null);
        if (client == null) {
            cfTokenHistFailLogger.logFail("NEW", id, null, "아이디 또는 비밀번호가 올바르지 않습니다.", callerIp, callerSystem);
            throw new CfBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }
        if (!"Y".equals(client.getUseYn())) {
            cfTokenHistFailLogger.logFail("NEW", id, client.getClientNm(), "사용이 중지된 계정입니다: " + id, callerIp, callerSystem);
            throw new CfBizException("사용이 중지된 계정입니다: " + id);
        }
        if (!passwordEncoder.matches(pwd, client.getClientPwd())) {
            cfTokenHistFailLogger.logFail("NEW", id, client.getClientNm(), "아이디 또는 비밀번호가 올바르지 않습니다.", callerIp, callerSystem);
            throw new CfBizException("아이디 또는 비밀번호가 올바르지 않습니다.");
        }

        String accessToken = cfJwtProvider.createAccessToken(client.getClientId());
        String refreshToken = cfJwtProvider.createRefreshToken(client.getClientId());
        long accessTtl = cfJwtProvider.getAccessExpirySeconds();
        long refreshTtl = cfJwtProvider.getRefreshExpirySeconds();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime accessExp = now.plusSeconds(accessTtl);
        LocalDateTime refreshExp = now.plusSeconds(refreshTtl);

        String tokenId = CfIdUtil.generateTokenId();
        cfTokenRepository.save(CfToken.builder()
            .tokenId(tokenId)
            .clientId(client.getClientId())
            .accessToken(accessToken)
            .refreshToken(refreshToken)
            .accessTokenExp(accessExp)
            .refreshTokenExp(refreshExp)
            .accessTokenTtlSec((int) accessTtl)
            .refreshTokenTtlSec((int) refreshTtl)
            .reason(REASON_NEW)
            .issuedIp(callerIp)
            .requesterSystemNm(callerSystem)
            .regBy(client.getClientId())
            .regDate(now)
            .updBy(client.getClientId())
            .updDate(now)
            .build());

        cfTokenHistRepository.save(CfTokenHist.builder()
            .histId(CfIdUtil.generateTokenHistId())
            .clientId(client.getClientId())
            .tokenId(tokenId)
            .actionCd("NEW")
            .resultCd(RESULT_SUCCESS)
            .resultMsg("로그인 성공")
            .reason(REASON_NEW)
            .clientNm(client.getClientNm())
            .refreshToken(refreshToken)
            .accessTokenExp(accessExp)
            .refreshTokenExp(refreshExp)
            .accessTokenTtlSec((int) accessTtl)
            .refreshTokenTtlSec((int) refreshTtl)
            .issuedIp(callerIp)
            .requesterSystemNm(callerSystem)
            .regBy(client.getClientId())
            .regDate(now)
            .build());

        // Redis 세션 캐시(선택) — DB(cf_token)가 여전히 단일 소스이며, 이건 조회 편의용 캐시일
        // 뿐이다(BoAuthService.login() 의 boAuthRedisStore.saveSession() 과 동일 패턴).
        cfAuthRedisStore.saveSession(client.getClientId(), Map.of(
            "tokenId", tokenId,
            "issuedIp", callerIp == null ? "" : callerIp,
            "requesterSystemNm", callerSystem == null ? "" : callerSystem,
            "loginAt", now.toString()
        ), accessTtl);

        log.info("[CfAuthService] 로그인 성공: clientId={} ip={} system={}", id, callerIp, callerSystem);
        // refreshToken 은 응답에 절대 안 실어보낸다(서버 DB 보관 원칙) — EcAdminApi 의
        // BoAuthService/FoAuthService.login() 이 LoginRes.refreshToken(null) 로 두는 것과 동일.
        return new CfTokenResponse(accessToken, null, accessTtl);
    }

    /**
     * accessToken 재발급 — 요청사항: refreshToken 은 클라이언트에 절대 안 넘기고 서버(cf_token)에만
     * 보관한다. 그래서 클라이언트는 refreshToken 을 보낼 방법이 없고, 대신 "지금 갖고 있는(막
     * 만료됐을 수도 있는) accessToken" 을 보내면 서버가 그 값으로 세션 행(cf_token)을 찾아 그 안에
     * 보관된 refreshToken 의 유효성만 서버 내부에서 확인하고 새 accessToken 을 발급한다 —
     * EcAdminApi 의 BoAuthService.refresh(expiredAccessToken) 와 완전히 동일한 패턴.
     */
    @Transactional
    public CfTokenResponse refresh(String expiredAccessToken, String callerIp, String callerSystem) {
        if (expiredAccessToken == null || expiredAccessToken.isBlank()) {
            cfTokenHistFailLogger.logFail("REFRESH", null, null, "accessToken이 필요합니다.", callerIp, callerSystem);
            throw new CfBizException("accessToken이 필요합니다.");
        }
        // Redis 블랙리스트 즉시무효화(선택, 스위치 꺼지면 항상 false) — 강제폐기(revoke)된
        // accessToken 은 DB 조회(findByAccessToken, 이미 지워졌으니 실패)까지 갈 필요도 없이
        // 여기서 바로 거절한다. DB 쪽 체크(아래 existing==null)가 여전히 최종 방어선이라 Redis
        // 가 꺼져 있거나 캐시가 비어도 안전성은 그대로 유지된다.
        if (cfAuthRedisStore.isBlacklisted(expiredAccessToken)) {
            cfTokenHistFailLogger.logFail("REFRESH", null, null, "강제 폐기된 토큰입니다. 다시 로그인해주세요.", callerIp, callerSystem);
            throw new CfBizException("강제 폐기된 토큰입니다. 다시 로그인해주세요.");
        }
        Claims claims;
        try {
            claims = cfJwtProvider.getClaimsAllowExpired(expiredAccessToken);
        } catch (Exception e) {
            cfTokenHistFailLogger.logFail("REFRESH", null, null, "유효하지 않은 accessToken입니다.", callerIp, callerSystem);
            throw new CfBizException("유효하지 않은 accessToken입니다.");
        }
        String clientId = claims.getSubject();
        if (clientId == null || clientId.isBlank()) {
            cfTokenHistFailLogger.logFail("REFRESH", null, null, "토큰에서 계정 정보를 확인할 수 없습니다.", callerIp, callerSystem);
            throw new CfBizException("토큰에서 계정 정보를 확인할 수 없습니다.");
        }

        CfClient client = cfClientRepository.findById(clientId).orElse(null);
        if (client == null) {
            cfTokenHistFailLogger.logFail("REFRESH", clientId, null, "존재하지 않는 계정입니다: " + clientId, callerIp, callerSystem);
            throw new CfBizException("존재하지 않는 계정입니다: " + clientId);
        }
        if (!"Y".equals(client.getUseYn())) {
            cfTokenHistFailLogger.logFail("REFRESH", clientId, client.getClientNm(), "사용이 중지된 계정입니다: " + clientId, callerIp, callerSystem);
            throw new CfBizException("사용이 중지된 계정입니다: " + clientId);
        }

        // 강제 폐기(revoke)되었거나 애초에 로그인 기록이 없으면(cf_token 행 없음) 재발급 불가.
        CfToken existing = cfTokenRepository.findByAccessToken(expiredAccessToken).orElse(null);
        if (existing == null) {
            cfTokenHistFailLogger.logFail("REFRESH", clientId, client.getClientNm(), "로그인 세션을 찾을 수 없습니다. 다시 로그인해주세요.", callerIp, callerSystem);
            throw new CfBizException("로그인 세션을 찾을 수 없습니다. 다시 로그인해주세요.");
        }

        // 서버가 보관 중인 refreshToken 자체의 만료 여부 확인(클라이언트에겐 절대 안 보임).
        if (!cfJwtProvider.validate(existing.getRefreshToken())) {
            cfTokenHistFailLogger.logFailWithToken("REFRESH", clientId, client.getClientNm(), existing,
                "refreshToken이 만료되었습니다. 다시 로그인해주세요.", callerIp, callerSystem);
            cfTokenRepository.delete(existing);
            throw new CfBizException("refreshToken이 만료되었습니다. 다시 로그인해주세요.");
        }

        String newAccessToken = cfJwtProvider.createAccessToken(clientId);
        long accessTtl = cfJwtProvider.getAccessExpirySeconds();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime accessExp = now.plusSeconds(accessTtl);

        // accessToken 이 바뀌므로 다음 refresh() 는 이 새 값으로 다시 찾아야 한다 — findByAccessToken
        // 조회 키를 최신 상태로 유지.
        existing.setAccessToken(newAccessToken);
        existing.setAccessTokenExp(accessExp);
        existing.setAccessTokenTtlSec((int) accessTtl);
        existing.setReason(REASON_REFRESH);
        existing.setIssuedIp(callerIp);
        existing.setRequesterSystemNm(callerSystem);
        existing.setUpdBy(clientId);
        existing.setUpdDate(now);
        cfTokenRepository.save(existing);

        cfTokenHistRepository.save(CfTokenHist.builder()
            .histId(CfIdUtil.generateTokenHistId())
            .clientId(clientId)
            .tokenId(existing.getTokenId())
            .actionCd("REFRESH")
            .resultCd(RESULT_SUCCESS)
            .resultMsg("재발급 성공")
            .reason(REASON_REFRESH)
            .refreshToken(existing.getRefreshToken())
            .accessTokenExp(accessExp)
            .refreshTokenExp(existing.getRefreshTokenExp())
            .accessTokenTtlSec((int) accessTtl)
            .refreshTokenTtlSec(existing.getRefreshTokenTtlSec())
            .issuedIp(callerIp)
            .requesterSystemNm(callerSystem)
            .regBy(clientId)
            .regDate(now)
            .build());

        // 세션 캐시 갱신(선택) — accessToken 이 바뀌었으니 loginAt 은 최초 로그인 시각을 잃지만,
        // 이 캐시는 "지금 이 clientId 로 유효한 세션이 있다"는 조회 편의용일 뿐이라 문제없다.
        cfAuthRedisStore.saveSession(clientId, Map.of(
            "tokenId", existing.getTokenId(),
            "issuedIp", callerIp == null ? "" : callerIp,
            "requesterSystemNm", callerSystem == null ? "" : callerSystem,
            "refreshedAt", now.toString()
        ), accessTtl);

        return new CfTokenResponse(newAccessToken, null, accessTtl);
    }

    /** 강제 폐기(요청사항) — cf_token 행을 지워서 이 토큰으로는 더 이상 재발급이 안 되게 한다.
     *  이미 발급된 accessToken 은 무상태(stateless) JWT라 자연 만료(최대 30초)까지는 그대로 유효하다. */
    @Transactional
    public void revoke(String tokenId, String reason) {
        CfToken token = cfTokenRepository.findById(tokenId)
            .orElseThrow(() -> new CfBizException("존재하지 않는 토큰입니다: " + tokenId));
        cfTokenRepository.delete(token);
        cfTokenHistRepository.save(CfTokenHist.builder()
            .histId(CfIdUtil.generateTokenHistId())
            .clientId(token.getClientId())
            .tokenId(tokenId)
            .actionCd("REVOKE")
            .resultCd(RESULT_SUCCESS)
            .resultMsg("강제 폐기 처리됨")
            .reason(reason == null || reason.isBlank() ? "관리자 강제 폐기" : reason)
            .refreshToken(token.getRefreshToken())
            .accessTokenExp(token.getAccessTokenExp())
            .refreshTokenExp(token.getRefreshTokenExp())
            .accessTokenTtlSec(token.getAccessTokenTtlSec())
            .refreshTokenTtlSec(token.getRefreshTokenTtlSec())
            .issuedIp(token.getIssuedIp())
            .requesterSystemNm(token.getRequesterSystemNm())
            .regBy("admin-ui")
            .regDate(LocalDateTime.now())
            .build());

        // Redis 즉시무효화(선택) — accessToken 은 무상태(stateless) JWT 라 DB 행을 지워도 자연만료
        // (최대 30초)까지는 여전히 유효하게 "보인다". 블랙리스트에 남은 유효시간만큼 등록해두면
        // refresh() 초입에서 곧바로 거절되어 실질적으로 "즉시" 무효화된다.
        long remainingSeconds = Duration.between(LocalDateTime.now(), token.getAccessTokenExp()).getSeconds();
        cfAuthRedisStore.blacklistToken(token.getAccessToken(), remainingSeconds);
        cfAuthRedisStore.removeSession(token.getClientId());

        log.info("[CfAuthService] 강제 폐기: tokenId={} clientId={}", tokenId, token.getClientId());
    }
}
