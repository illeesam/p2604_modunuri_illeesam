package com.shopjoy.ecadminapi.common.log;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.net.InetAddress;

/**
 * AccessLogFilter 를 Spring Security 보다 먼저 실행되도록 FilterRegistrationBean 으로 등록.
 *
 * ── 비동기 처리 흐름 ──────────────────────────────────────────────
 *
 *   [요청 스레드]
 *     HTTP 요청
 *       → AccessLogFilter (order -200, Spring Security -100 보다 앞)
 *           ContentCachingWrapper 로 request/response 감쌈
 *           체인 실행 (Spring Security → JwtAuthFilter → Controller)
 *           체인 종료 후 request attribute 에서 인증 정보 수집
 *           AccessLogProperties.isMatch() 로 기록 대상 판별
 *           AccessLogQueue.offer() — non-blocking, 즉시 리턴
 *
 *   [access-log-worker 데몬 스레드]  ← 요청 스레드와 완전 분리
 *     AccessLogQueue.poll(2초)
 *       → SyhAccessLogRepository.save() — DB INSERT
 *
 * ── 큐 보호 정책 ─────────────────────────────────────────────────
 *
 *   큐 최대 크기 : app.access-log.queue-size (기본 100건)
 *   포화 시 처리 : 즉시 드롭 (non-blocking offer) — 요청 스레드 지연 없음
 *   드롭 경고   : 100건마다 System.err 출력
 *   종료 flush  : @PreDestroy 에서 잔여 최대 50건 저장 시도
 *
 * ── AccessAppender vs AsyncAppender 비교 ────────────────────────
 *
 *   error-log 는 Logback 기반이므로 AsyncAppender 사용 가능.
 *   access-log 는 서블릿 필터 기반(Logback 미경유)이므로
 *   AccessLogQueue + 워커 스레드가 AsyncAppender 와 동일한 역할을 수행.
 *
 * (order -200 → Spring Security default -100 보다 앞)
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
@EnableConfigurationProperties(AccessLogProperties.class)
public class AccessLogConfig {

    private final AccessLogQueue      accessLogQueue;
    private final AccessLogProperties props;
    private final Environment         env;

    /** accessLogFilterBean */
    @Bean
    public FilterRegistrationBean<AccessLogFilter> accessLogFilterBean() {
        String serverNm = resolveServerName();
        String profile  = String.join(",", env.getActiveProfiles());
        if (profile.isBlank()) profile = "default";

        AccessLogFilter filter = new AccessLogFilter(accessLogQueue, props, serverNm, profile);

        FilterRegistrationBean<AccessLogFilter> bean = new FilterRegistrationBean<>(filter);
        bean.setOrder(-200);          // Spring Security(-100) 보다 먼저 실행
        bean.addUrlPatterns("/*");

        log.info("[AccessLog] AccessLogFilter 등록 — dbSave={} filter='{}' maxBodySize={} queueSize={}",
                props.isDbSave(), props.getFilter(), props.getMaxBodySize(), props.getQueueSize());
        return bean;
    }

    /** resolveServerName — 결정 */
    private String resolveServerName() {
        try {
            return InetAddress.getLocalHost().getHostName();
        } catch (Exception e) {
            return "unknown";
        }
    }
}
