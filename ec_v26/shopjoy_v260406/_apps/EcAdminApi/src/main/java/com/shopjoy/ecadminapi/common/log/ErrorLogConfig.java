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

    private final ErrorLogQueue errorLogQueue;
    private final Environment   env;

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
