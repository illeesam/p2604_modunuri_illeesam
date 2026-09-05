package com.shopjoy.eccdnapi.auth.service;

import com.shopjoy.eccdnapi.auth.entity.CfToken;
import com.shopjoy.eccdnapi.auth.entity.CfTokenHist;
import com.shopjoy.eccdnapi.auth.repository.CfTokenHistRepository;
import com.shopjoy.eccdnapi.common.util.CfIdUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * cf_token_hist 실패(FAIL) 기록 전용 — CfAuthService 의 login()/refresh() 에서 예외를 던지기
 * 직전에 호출한다. 반드시 별도 빈(bean)으로 분리해야 한다: 같은 빈 안의 메서드를
 * {@code this.fnLogFail(...)} 형태(자기 자신 호출)로 부르면 Spring AOP 프록시를 거치지 않아
 * {@code @Transactional(REQUIRES_NEW)} 가 적용되지 않고, 바깥 트랜잭션(login/refresh)이 예외로
 * 롤백될 때 이 실패 로그 INSERT 까지 같이 롤백되어 버린다(2026-09-06 실제로 겪은 버그 — 배포 후
 * 라이브 curl 검증에서 실패 로그인을 일으켜도 cf_token_hist 에 FAIL 행이 하나도 안 쌓이는 것을
 * 발견하고 원인을 self-invocation 으로 특정, 이 클래스로 분리해 해결했다). 이 클래스를 CfAuthService
 * 가 DI 로 주입받아 진짜 외부 빈 호출로 거치게 하면 REQUIRES_NEW 가 정상적으로 새 트랜잭션을 열어
 * 커밋하므로, 바깥 트랜잭션이 나중에 롤백돼도 실패 로그는 남는다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CfTokenHistFailLogger {

    private final CfTokenHistRepository cfTokenHistRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFail(String actionCd, String clientId, String clientNm, String msg, String callerIp, String callerSystem) {
        cfTokenHistRepository.save(CfTokenHist.builder()
            .histId(CfIdUtil.generateTokenHistId())
            .clientId(clientId == null ? "UNKNOWN" : clientId)
            .actionCd(actionCd)
            .resultCd("FAIL")
            .resultMsg(msg)
            .clientNm(clientNm)
            .issuedIp(callerIp)
            .requesterSystemNm(callerSystem)
            .regBy(clientId == null ? "UNKNOWN" : clientId)
            .regDate(LocalDateTime.now())
            .build());
        log.warn("[CfTokenHistFailLogger] {} 실패: clientId={} msg={} ip={} system={}", actionCd, clientId, msg, callerIp, callerSystem);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logFailWithToken(String actionCd, String clientId, String clientNm, CfToken existing,
                                  String msg, String callerIp, String callerSystem) {
        cfTokenHistRepository.save(CfTokenHist.builder()
            .histId(CfIdUtil.generateTokenHistId())
            .clientId(clientId == null ? "UNKNOWN" : clientId)
            .tokenId(existing.getTokenId())
            .actionCd(actionCd)
            .resultCd("FAIL")
            .resultMsg(msg)
            .clientNm(clientNm)
            .refreshToken(existing.getRefreshToken())
            .accessTokenExp(existing.getAccessTokenExp())
            .refreshTokenExp(existing.getRefreshTokenExp())
            .accessTokenTtlSec(existing.getAccessTokenTtlSec())
            .refreshTokenTtlSec(existing.getRefreshTokenTtlSec())
            .issuedIp(callerIp)
            .requesterSystemNm(callerSystem)
            .regBy(clientId == null ? "UNKNOWN" : clientId)
            .regDate(LocalDateTime.now())
            .build());
        log.warn("[CfTokenHistFailLogger] {} 실패: clientId={} msg={} ip={} system={}", actionCd, clientId, msg, callerIp, callerSystem);
    }
}
