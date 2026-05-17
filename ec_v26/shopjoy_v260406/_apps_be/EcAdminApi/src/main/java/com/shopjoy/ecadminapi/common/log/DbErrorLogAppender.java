package com.shopjoy.ecadminapi.common.log;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.classic.spi.IThrowableProxy;
import ch.qos.logback.classic.spi.StackTraceElementProxy;
import ch.qos.logback.core.UnsynchronizedAppenderBase;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyhAccessErrorLog;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Logback ERROR 이벤트 → ErrorLogQueue 적재 Appender.
 *
 * Spring 빈이 아니므로 ErrorLogConfig 에서 bindQueue() 로 ErrorLogQueue 를 주입한다.
 * 자기 자신의 패키지 로그는 무시하여 재귀 무한루프를 방지한다.
 */
public class DbErrorLogAppender extends UnsynchronizedAppenderBase<ILoggingEvent> {

    /** 자기 자신 패키지 로그를 무시해 재귀 무한루프를 막기 위한 패키지 프리픽스 */
    private static final String OWN_PKG        = "com.shopjoy.ecadminapi.common.log";
    /** 스택트레이스 저장 최대 길이(문자) */
    private static final int    MAX_STACK_LEN  = 3000;
    /** 에러 메시지 저장 최대 길이(문자) */
    private static final int    MAX_MSG_LEN    = 2000;
    /** site_id 는 NOT NULL — MDC siteId 미설정/"-" 시 대표 사이트로 fallback */
    private static final String DEFAULT_SITE_ID = "SITE000001";
    /** logId 생성용 타임스탬프 포맷 (yyMMddHHmmss) */
    private static final DateTimeFormatter ID_FMT =
            DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /**
     * 비동기 적재 큐. Appender 는 Spring 빈이 아니므로 ErrorLogConfig 가 컨텍스트 로드 후
     * bind() 로 주입한다. Logback 스레드와 Spring 초기화 스레드 간 가시성 확보를 위해 volatile.
     */
    private static volatile ErrorLogQueue errorLogQueue;
    /** 로그 레코드의 server_nm 컬럼 값 (bind 시 주입) */
    private static volatile String        serverNm;
    /** 로그 레코드의 profile 컬럼 값 (bind 시 주입) */
    private static volatile String        activeProfile;

    /**
     * Spring 컨텍스트 로드 완료 후 큐·서버명·프로파일을 정적 필드에 주입한다.
     *
     * <p>Logback 은 Spring 보다 먼저 초기화되어 logback-spring.xml 에서 Spring 빈을
     * 직접 참조할 수 없으므로, ErrorLogConfig.@PostConstruct 에서 본 메서드로 늦게 바인딩한다.
     * 주입 전 발생한 ERROR 로그는 append() 에서 큐 null 가드에 걸려 무시된다.
     *
     * @param queue   에러 로그 비동기 큐
     * @param server  서버 호스트명
     * @param profile 활성 프로파일 문자열
     */
    public static void bind(ErrorLogQueue queue, String server, String profile) {
        errorLogQueue  = queue;
        serverNm       = server;
        activeProfile  = profile;
    }

    /**
     * Logback 이 호출하는 이벤트 콜백. ERROR 이상 이벤트를 큐에 적재한다.
     *
     * <p>UnsynchronizedAppenderBase 를 상속하므로 로그를 발생시킨 호출 스레드에서
     * 동기 실행된다. 따라서 여기서는 객체 생성 + 큐 offer 만 빠르게 수행하고,
     * 실제 DB INSERT 는 워커 스레드(ErrorLogQueue)가 담당해 로깅 호출이 블로킹되지 않는다.
     *
     * <p>가드 조건:
     * <ul>
     *   <li>큐 미바인딩(null) → 무시 (Spring 초기화 이전 이벤트)</li>
     *   <li>ERROR 미만 레벨 → 무시</li>
     *   <li>자기 패키지 로거 → 무시 (재귀 무한루프 방지)</li>
     * </ul>
     * MDC 맵에서 요청·인증·X-헤더 정보를 복원해 레코드를 채우며, 변환 중 예외는
     * addError 로만 보고하여 로깅 파이프라인이 죽지 않도록 한다.
     *
     * @param event Logback 로깅 이벤트
     */
    @Override
    protected void append(ILoggingEvent event) {
        if (errorLogQueue == null) return;
        if (!event.getLevel().isGreaterOrEqual(Level.ERROR)) return;
        // 자기 패키지 로그 → 재귀 방지
        if (event.getLoggerName().startsWith(OWN_PKG)) return;

        try {
            Map<String, String> mdc = event.getMDCPropertyMap();
            String siteId = mdc.get("siteId");
            if (siteId == null || siteId.isBlank() || "-".equals(siteId)) siteId = DEFAULT_SITE_ID;
            SyhAccessErrorLog entry = SyhAccessErrorLog.builder()
                    .logId(generateId())
                    .siteId(siteId)
                    // 요청 정보
                    .reqMethod(mdc.getOrDefault("reqMethod", "-"))
                    .reqHost  (mdc.getOrDefault("reqHost",   "-"))
                    .reqPath  (mdc.getOrDefault("reqPath",   "-"))
                    .reqQuery (mdc.getOrDefault("reqQuery",  null))
                    .reqIp    (mdc.getOrDefault("reqIp",     "-"))
                    .reqUa    (truncate(mdc.getOrDefault("reqUa", null), 500))
                    // 인증 정보
                    .appTypeCd (mdc.getOrDefault("appTypeCd",  "-"))
                    .userId   (mdc.getOrDefault("userId",    "-"))
                    .roleId   (mdc.getOrDefault("roleId",    null))
                    .deptId   (mdc.getOrDefault("deptId",    null))
                    .vendorId (mdc.getOrDefault("vendorId",  null))
                    .localeId (null)
                    // 경과 시간
                    .respTimeMs(resolveElapsedMs(mdc, event.getTimeStamp()))
                    // 에러 정보
                    .errorType(extractErrorType(event))
                    .errorMsg (truncate(event.getFormattedMessage(), MAX_MSG_LEN))
                    .stackTrace(formatStackTrace(event.getThrowableProxy()))
                    // X-헤더
                    .uiNm    (truncate(mdc.getOrDefault("uiNm",    null), 200))
                    .cmdNm   (truncate(mdc.getOrDefault("cmdNm",   null), 200))
                    .fileNm  (truncate(mdc.getOrDefault("fileNm",  null), 200))
                    .funcNm  (truncate(mdc.getOrDefault("funcNm",  null), 200))
                    .lineNo  (truncate(mdc.getOrDefault("lineNo",  null), 10))
                    .traceId (truncate(mdc.getOrDefault("traceId", null), 50))
                    // 실행 환경
                    .serverNm (serverNm)
                    .profile  (activeProfile)
                    .threadNm (event.getThreadName())
                    .loggerNm (event.getLoggerName())
                    // 시각
                    .logDt   (toLocalDateTime(event.getTimeStamp()))
                    .regDate (LocalDateTime.now())
                    .build();

            errorLogQueue.offer(entry);
        } catch (Exception e) {
            addError("DbErrorLogAppender 처리 실패", e);
        }
    }

    // ── 유틸 ────────────────────────────────────────────────────────────

    /**
     * 에러 로그 PK(log_id)를 생성한다.
     *
     * <p>형식: "EL" + yyMMddHHmmss + 4자리 난수. 동일 초 내 다중 에러 충돌을 난수로 완화.
     *
     * @return 생성된 로그 ID
     */
    private static String generateId() {
        String ts = LocalDateTime.now().format(ID_FMT);
        return "EL" + ts + String.format("%04d", (int) (Math.random() * 10000));
    }

    /**
     * epoch millis 를 시스템 기본 시간대의 LocalDateTime 으로 변환한다.
     *
     * @param epochMillis Logback 이벤트 타임스탬프(ms)
     * @return 변환된 LocalDateTime
     */
    private static LocalDateTime toLocalDateTime(long epochMillis) {
        return Instant.ofEpochMilli(epochMillis)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    /**
     * 이벤트에 첨부된 예외의 클래스명을 에러 타입으로 추출한다.
     *
     * @param event 로깅 이벤트
     * @return 예외 클래스명, 예외가 없으면 null
     */
    private static String extractErrorType(ILoggingEvent event) {
        IThrowableProxy proxy = event.getThrowableProxy();
        return proxy != null ? proxy.getClassName() : null;
    }

    /**
     * 예외 프록시를 사람이 읽을 수 있는 스택트레이스 문자열로 포맷한다.
     *
     * <p>최상위 예외 메시지 + 스택 프레임을 누적하되 MAX_STACK_LEN 도달 시
     * "(truncated)" 로 잘라 과도한 컬럼 적재를 막는다. 길이 여유가 있으면
     * "Caused by:" 한 단계만 덧붙인다.
     *
     * @param proxy Logback 예외 프록시 (null 허용)
     * @return 포맷된 스택트레이스, 예외가 없으면 null
     */
    private static String formatStackTrace(IThrowableProxy proxy) {
        if (proxy == null) return null;
        StringBuilder sb = new StringBuilder();
        sb.append(proxy.getClassName()).append(": ").append(proxy.getMessage()).append("\n");
        for (StackTraceElementProxy el : proxy.getStackTraceElementProxyArray()) {
            sb.append("\tat ").append(el.getSTEAsString()).append("\n");
            if (sb.length() >= MAX_STACK_LEN) {
                sb.append("\t... (truncated)");
                break;
            }
        }
        // caused by
        IThrowableProxy cause = proxy.getCause();
        if (cause != null && sb.length() < MAX_STACK_LEN) {
            sb.append("Caused by: ").append(cause.getClassName())
              .append(": ").append(cause.getMessage()).append("\n");
        }
        return sb.toString();
    }

    /**
     * MDC 의 요청 시작 시각(reqStartMs)과 이벤트 시각 차이로 경과 시간을 계산한다.
     *
     * @param mdc     MDC 프로퍼티 맵
     * @param eventTs 로깅 이벤트 타임스탬프(ms)
     * @return 경과 ms. reqStartMs 부재/파싱 실패/음수면 null
     */
    private static Long resolveElapsedMs(Map<String, String> mdc, long eventTs) {
        String startMs = mdc.get("reqStartMs");
        if (startMs == null || startMs.isBlank()) return null;
        try {
            long elapsed = eventTs - Long.parseLong(startMs);
            return elapsed >= 0 ? elapsed : null;
        } catch (NumberFormatException e) {
            return null;
        }
    }

    /**
     * 컬럼 길이 제약에 맞춰 문자열을 절단한다.
     *
     * @param s   원본 문자열 (null 허용)
     * @param max 최대 길이
     * @return 절단된 문자열, 입력이 null 이면 null
     */
    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
