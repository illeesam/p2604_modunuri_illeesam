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

    private static final String OWN_PKG        = "com.shopjoy.ecadminapi.common.log";
    private static final int    MAX_STACK_LEN  = 3000;
    private static final int    MAX_MSG_LEN    = 2000;
    private static final DateTimeFormatter ID_FMT =
            DateTimeFormatter.ofPattern("yyMMddHHmmss");

    /** ErrorLogConfig 에서 Spring 컨텍스트 로드 후 주입 */
    private static volatile ErrorLogQueue errorLogQueue;
    private static volatile String        serverNm;
    private static volatile String        activeProfile;

    public static void bind(ErrorLogQueue queue, String server, String profile) {
        errorLogQueue  = queue;
        serverNm       = server;
        activeProfile  = profile;
    }

    @Override
    protected void append(ILoggingEvent event) {
        if (errorLogQueue == null) return;
        if (!event.getLevel().isGreaterOrEqual(Level.ERROR)) return;
        // 자기 패키지 로그 → 재귀 방지
        if (event.getLoggerName().startsWith(OWN_PKG)) return;

        try {
            Map<String, String> mdc = event.getMDCPropertyMap();
            SyhAccessErrorLog entry = SyhAccessErrorLog.builder()
                    .logId(generateId())
                    // 요청 정보
                    .reqMethod(mdc.getOrDefault("reqMethod", "-"))
                    .reqHost  (mdc.getOrDefault("reqHost",   "-"))
                    .reqPath  (mdc.getOrDefault("reqPath",   "-"))
                    .reqQuery (mdc.getOrDefault("reqQuery",  null))
                    .reqIp    (mdc.getOrDefault("reqIp",     "-"))
                    .reqUa    (truncate(mdc.getOrDefault("reqUa", null), 500))
                    // 인증 정보
                    .userTypeCd (mdc.getOrDefault("userTypeCd",  "-"))
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

    private static String generateId() {
        String ts = LocalDateTime.now().format(ID_FMT);
        return "EL" + ts + String.format("%04d", (int) (Math.random() * 10000));
    }

    private static LocalDateTime toLocalDateTime(long epochMillis) {
        return Instant.ofEpochMilli(epochMillis)
                .atZone(ZoneId.systemDefault())
                .toLocalDateTime();
    }

    private static String extractErrorType(ILoggingEvent event) {
        IThrowableProxy proxy = event.getThrowableProxy();
        return proxy != null ? proxy.getClassName() : null;
    }

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

    private static String truncate(String s, int max) {
        if (s == null) return null;
        return s.length() <= max ? s : s.substring(0, max);
    }
}
