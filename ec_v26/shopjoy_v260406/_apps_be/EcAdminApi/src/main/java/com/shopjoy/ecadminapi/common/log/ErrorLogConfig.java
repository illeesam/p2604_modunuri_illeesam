package com.shopjoy.ecadminapi.common.log;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.LoggerContext;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

import java.net.InetAddress;

/**
 * DbErrorLogAppender 를 Logback root logger 에 동적 등록.
 *
 * 흐름:
 *   log.error() → DbErrorLogAppender.append() [동기, 객체생성+offer만 수행]
 *               → ErrorLogQueue.offer() [non-blocking]
 *               → err-log-worker [데몬 스레드, 2초 poll] → DB INSERT
 *
 * @PostConstruct 사용 이유:
 *   Logback 은 Spring 컨텍스트보다 먼저 초기화되므로 logback-spring.xml 에서
 *   Spring 빈(ErrorLogQueue)을 직접 참조할 수 없다.
 *   Spring 로드 완료 후 bind() 로 static volatile 필드에 주입한다.
 *
 * AsyncAppender 미사용 이유:
 *   ErrorLogQueue(LinkedBlockingQueue + 워커 스레드)가 동일한 역할을 제공하므로
 *   AsyncAppender 를 추가하면 큐가 이중으로 구성되어 복잡도만 증가한다.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ErrorLogConfig {

    /** Appender 에 bind 할 에러 로그 비동기 큐 */
    private final ErrorLogQueue errorLogQueue;
    /** 활성 프로파일 조회용 — 로그 레코드의 profile 컬럼에 기록 */
    private final Environment   env;

    /**
     * Spring 컨텍스트 로드 후 DbErrorLogAppender 를 Logback root logger 에 동적 등록한다.
     *
     * <p>Logback 은 Spring 보다 먼저 초기화되므로 logback-spring.xml 에서 Spring 빈을
     * 참조할 수 없다. 따라서 본 메서드에서 (1) DbErrorLogAppender.bind() 로 큐·서버명·
     * 프로파일을 정적 필드에 늦게 주입하고, (2) Appender 인스턴스를 생성·start 한 뒤
     * root logger 에 add 한다. 등록 이후 발생하는 모든 ERROR 로그가 DB 적재 대상이 된다.
     */
    @PostConstruct
    public void registerAppender() {
        String serverNm = resolveServerName();
        String profile  = String.join(",", env.getActiveProfiles());
        if (profile.isBlank()) profile = "default";

        // Spring 빈 → logback 앱에더에 바인딩 (static volatile 경유)
        DbErrorLogAppender.bind(errorLogQueue, serverNm, profile);

        // logback root logger 에 앱에더 등록
        LoggerContext ctx = (LoggerContext) LoggerFactory.getILoggerFactory();

        DbErrorLogAppender appender = new DbErrorLogAppender();
        appender.setName("SYH_ACCESS_ERROR_LOG");
        appender.setContext(ctx);  // Logback 인프라 연결 (데이터 아님)
        appender.start();

        ctx.getLogger(Logger.ROOT_LOGGER_NAME).addAppender(appender);

        log.info("[ErrorLog] DbErrorLogAppender 등록 완료 — server={} profile={} queueSize={}",
                serverNm, profile, errorLogQueue.getQueueSize());
    }

    /**
     * 로그 레코드에 기록할 서버명을 결정한다.
     *
     * <p>{@code InetAddress.getLocalHost()} 는 DNS 역조회로 인해 Windows 개발 환경에서
     * 최대 ~10초 블로킹될 수 있어 사용하지 않는다. OS 환경변수(COMPUTERNAME/HOSTNAME)를
     * 우선 사용하고, 없으면 DNS 호출이 없는 루프백 호스트명("localhost")으로 폴백한다.
     *
     * @return 서버 호스트명
     */
    private String resolveServerName() {
        // InetAddress.getLocalHost() blocks on DNS reverse lookup (~10s on Windows dev)
        // Use OS env vars first; fall back to loopback address (instant, no DNS)
        String name = System.getenv("COMPUTERNAME"); // Windows
        if (name != null && !name.isBlank()) return name;
        name = System.getenv("HOSTNAME"); // Linux / macOS
        if (name != null && !name.isBlank()) return name;
        return InetAddress.getLoopbackAddress().getHostName(); // "localhost" — no DNS call
    }
}
