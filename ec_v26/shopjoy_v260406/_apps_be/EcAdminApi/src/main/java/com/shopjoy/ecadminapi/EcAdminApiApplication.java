package com.shopjoy.ecadminapi;

import lombok.extern.slf4j.Slf4j;
import org.apache.ibatis.annotations.Mapper;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;

import javax.sql.DataSource;
import java.sql.Connection;

@Slf4j
@SpringBootApplication
@MapperScan(
    basePackages = {"com.shopjoy.ecadminapi"},
    annotationClass = Mapper.class
)
public class EcAdminApiApplication {

    /** main */
    public static void main(String[] args) {
        long startedAt = System.currentTimeMillis();
        log.info("[EcAdminApi] ===== 애플리케이션 시작 중 =====");
        ConfigurableApplicationContext ctx = SpringApplication.run(EcAdminApiApplication.class, args);
        String profiles = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (profiles.isBlank()) profiles = "default";
        log.info("[EcAdminApi] ===== 애플리케이션 구동 완료 ... 2026-04-22 05:54  — active profiles: [{}] =====", profiles);

        checkDatabaseConnection(ctx);
        checkRedisConnection(ctx);
        checkFileStorageConfiguration(ctx);
        checkExtSdkConfiguration(ctx);
        checkMailConfiguration(ctx);
        checkSmsConfiguration(ctx);
        checkPushConfiguration(ctx);
        checkChatConfiguration(ctx);

        long elapsedMs = System.currentTimeMillis() - startedAt;
        String port = ctx.getEnvironment().getProperty("server.port", "8080");
        log.info("⏱  [구동 소요 시간] {}.{}초 ({} ms) :: {} 가 ({}) 모드로 시작되었습니다. (port: {})",
                elapsedMs / 1000, String.format("%03d", elapsedMs % 1000), elapsedMs,
                EcAdminApiApplication.class.getSimpleName(), profiles, port);
    }

    /** checkDatabaseConnection — 검증 */
    private static void checkDatabaseConnection(ConfigurableApplicationContext ctx) {
        try {
            DataSource dataSource = ctx.getBean(DataSource.class);
            try (Connection conn = dataSource.getConnection()) {
                if (conn != null && !conn.isClosed()) {
                    String dbUrl    = conn.getMetaData().getURL();
                    String dbDriver = conn.getMetaData().getDriverName();
                    String dbName   = extractDatabaseName(dbUrl);
                    String username = conn.getMetaData().getUserName();
                    logTable("✅ DB 연결 성공", new String[][]{
                        {"Driver",   dbDriver,  ""},
                        {"URL",      dbUrl,     ""},
                        {"Database", dbName,    ""},
                        {"Username", username,  ""},
                        {"Status",   "Connected", ""},
                    });
                } else {
                    log.error("❌ [DB 연결 실패] Connection is null or closed");
                }
            }
        } catch (Exception e) {
            log.error("❌ [DB 연결 실패] {}", e.getMessage(), e);
        }
    }

    /** extractDatabaseName — 추출 */
    private static String extractDatabaseName(String url) {
        try {
            // PostgreSQL: jdbc:postgresql://host:port/database?...
            if (url.contains("postgresql")) {
                String[] parts = url.split("/");
                if (parts.length > 3) {
                    String dbPart = parts[3];
                    return dbPart.split("\\?")[0];
                }
            }
            // MySQL: jdbc:mysql://host:port/database?...
            else if (url.contains("mysql")) {
                String[] parts = url.split("/");
                if (parts.length > 3) {
                    String dbPart = parts[3];
                    return dbPart.split("\\?")[0];
                }
            }
            return "unknown";
        } catch (Exception e) {
            return "unknown";
        }
    }

    /** checkRedisConnection — 검증 */
    private static void checkRedisConnection(ConfigurableApplicationContext ctx) {
        try {
            RedisTemplate<String, Object> primaryTemplate =
                ctx.getBean("primaryRedisTemplate", RedisTemplate.class);

            RedisConnectionFactory factory = primaryTemplate.getConnectionFactory();
            LettuceConnectionFactory lettuceFactory = (LettuceConnectionFactory) factory;
            String ping = factory.getConnection().ping();

            if ("PONG".equals(ping)) {
                String version = "unknown";
                try {
                    Object info = primaryTemplate.execute((RedisCallback<Object>) c -> c.info("server"));
                    if (info != null) {
                        for (String line : info.toString().split("\\r?\\n")) {
                            if (line.contains("redis_version:")) { version = line.split(":")[1].trim(); break; }
                        }
                    }
                } catch (Exception ex) { /* ignore */ }

                String host     = lettuceFactory.getStandaloneConfiguration().getHostName();
                int    port     = lettuceFactory.getStandaloneConfiguration().getPort();
                int    database = lettuceFactory.getStandaloneConfiguration().getDatabase();
                logTable("✅ Redis 연결 성공", new String[][]{
                    {"Host",     host,                   ""},
                    {"Port",     String.valueOf(port),   ""},
                    {"Database", String.valueOf(database), ""},
                    {"Version",  version,                ""},
                    {"Status",   "Connected",            ""},
                });
            } else {
                log.error("❌ [Redis 연결 실패] Unexpected ping response: {}", ping);
            }
        } catch (Exception e) {
            try {
                boolean enabled = ctx.getEnvironment().getProperty("app.redis.enabled", Boolean.class, false);
                if (!enabled) log.info("⊘  [Redis] 비활성화 상태 (app.redis.enabled=false)");
                else          log.error("❌ [Redis 연결 실패] {}", e.getMessage());
            } catch (Exception ex) {
                log.info("⊘  [Redis] 비활성화 상태 (Bean이 생성되지 않음)");
            }
        }
    }

    /** checkFileStorageConfiguration — 검증 */
    private static void checkFileStorageConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String storageType = env.getProperty("app.file.storage-type", "LOCAL");
            String cdnHost     = env.getProperty("app.file.cdn-host", "");
            String thumbEnabled = env.getProperty("app.file.thumbnail-enabled", "true");

            java.util.List<String[]> rows = new java.util.ArrayList<>();
            rows.add(new String[]{"Storage Type", storageType, ""});

            switch (storageType.toUpperCase()) {
                case "LOCAL":
                    rows.add(new String[]{"Base Path",  env.getProperty("app.file.local.base-path",  "static/cdn"), ""});
                    rows.add(new String[]{"Upload Dir", env.getProperty("app.file.local.upload-dir", "uploads"),    ""});
                    rows.add(new String[]{"Status",     "Local Storage Active", ""});
                    break;
                case "AWS_S3":
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.aws.bucket-name", ""), ""});
                    rows.add(new String[]{"Region",     env.getProperty("app.file.aws.region", "ap-northeast-2"), ""});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.aws.cdn-url", ""), ""});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.aws.access-key", "")), ""});
                    rows.add(new String[]{"Status",     "AWS S3 Active", ""});
                    break;
                case "NCP_OBS":
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.ncp.bucket-name", ""), ""});
                    rows.add(new String[]{"Endpoint",   env.getProperty("app.file.ncp.endpoint",    ""), ""});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.ncp.cdn-url",     ""), ""});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.ncp.access-key", "")), ""});
                    rows.add(new String[]{"Status",     "NCP OBS Active", ""});
                    break;
                default:
                    rows.add(new String[]{"Status", "Unknown: " + storageType, ""});
            }
            logTable("📁 파일 스토리지 설정", rows.toArray(new String[0][]));

            logTable("🌐 CDN / 정적 파일", new String[][]{
                {"CDN Host",  cdnHost.isBlank() ? "(not configured)" : cdnHost, "sy_prop : cdn.url.base"},
                {"Thumbnail", thumbEnabled, "application-{profile}.yml > app.file.thumbnail-enabled"},
            });
        } catch (Exception e) {
            log.warn("❌ [파일 스토리지] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /** checkExtSdkConfiguration — SNS/지도/결제 키 설정 상태 출력 */
    private static void checkExtSdkConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String googleClientId = env.getProperty("app.ext-sdk.google-client-id",   "");
            String kakaoJsKey     = env.getProperty("app.ext-sdk.kakao-js-key",        "");
            String naverClientId  = env.getProperty("app.ext-sdk.naver-client-id",     "");
            String naverCbUrl     = env.getProperty("app.ext-sdk.naver-callback-url",  "");
            String tossClientKey  = env.getProperty("app.ext-sdk.toss-client-key",     "");
            String tossSuccessUrl = env.getProperty("app.ext-sdk.toss-success-url",    "");
            String tossFailUrl    = env.getProperty("app.ext-sdk.toss-fail-url",       "");
            String kakaoMapJsKey  = env.getProperty("app.ext-sdk.kakao-map-js-key",    "");
            String naverMapId     = env.getProperty("app.ext-sdk.naver-map-client-id", "");

            String nc = "(not configured)";

            logTable("👤 소셜 로그인 — Google", new String[][]{
                {"Client ID", googleClientId.isBlank() ? nc : googleClientId, "sy_prop ^local^dev^ ext.sdk.googleClientId"},
            });

            logTable("👤 소셜 로그인 — Kakao", new String[][]{
                {"JS Key", kakaoJsKey.isBlank() ? nc : kakaoJsKey, "sy_prop ^local^dev^ ext.sdk.kakaoJsKey"},
            });

            logTable("👤 소셜 로그인 — Naver", new String[][]{
                {"Client ID", naverClientId.isBlank() ? nc : naverClientId, "sy_prop ^local^dev^ ext.sdk.naverClientId"},
                {"Callback",  naverCbUrl.isBlank()    ? nc : naverCbUrl,    "sy_prop ^local^dev^ ext.sdk.naverCallbackUrl"},
            });

            logTable("💳 결제 (Toss Payments)", new String[][]{
                {"Client Key",   tossClientKey.isBlank()  ? nc : tossClientKey,                        "sy_prop payment.toss.client_key"},
                {"Secret Key",   "(runtime)",                                                           "sy_prop payment.toss.secret_key"},
                {"Confirm URL",  "(runtime)",                                                           "sy_prop payment.toss.confirm_url"},
                {"Cancel URL",   "(runtime)",                                                           "sy_prop payment.toss.cancel_url"},
                {"Success URL",  tossSuccessUrl.isBlank() ? "(프론트 직접 전달)" : tossSuccessUrl,      "coExtSdk.js opts.successUrl"},
                {"Fail URL",     tossFailUrl.isBlank()    ? "(프론트 직접 전달)" : tossFailUrl,         "coExtSdk.js opts.failUrl"},
            });

            logTable("🗺  지도 API — Kakao", new String[][]{
                {"JS Key", kakaoMapJsKey.isBlank() ? nc : kakaoMapJsKey, "sy_prop ^local^dev^ ext.sdk.kakaoMapJsKey"},
            });

            logTable("🗺  지도 API — Naver", new String[][]{
                {"Client ID", naverMapId.isBlank() ? nc : naverMapId, "sy_prop ^local^dev^ ext.sdk.naverMapClientId"},
            });
        } catch (Exception e) {
            log.warn("❌ [외부 SDK 키] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /** checkSmsConfiguration — 문자(SMS) 발송 설정 */
    private static void checkSmsConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String provider   = env.getProperty("app.sms.provider",    "");
            String apiKey     = env.getProperty("app.sms.api-key",     "");
            String apiSecret  = env.getProperty("app.sms.api-secret",  "");
            String from       = env.getProperty("app.sms.from",        "");
            String enabled    = env.getProperty("app.sms.enabled",     "false");
            String nc = "(not configured)";
            logTable("📱 SMS 문자 발송", new String[][]{
                {"Enabled",    enabled,                               "application-{profile}.yml app.sms.enabled"},
                {"Provider",   provider.isBlank()  ? nc : provider,  "sy_prop app.sms.provider  (aligo / coolsms / ncp / twilio)"},
                {"API Key",    apiKey.isBlank()    ? nc : apiKey,    "sy_prop ^local^dev^ app.sms.api-key"},
                {"API Secret", apiSecret.isBlank() ? nc : maskMiddle(apiSecret), "sy_prop ^local^dev^ app.sms.api-secret"},
                {"From",       from.isBlank()      ? nc : from,      "sy_prop app.sms.from  (발신번호)"},
            });
        } catch (Exception e) {
            log.warn("❌ [SMS] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /** checkPushConfiguration — 푸시 알림 설정 (FCM / APNs) */
    private static void checkPushConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            // FCM
            String fcmEnabled    = env.getProperty("app.push.fcm.enabled",       "false");
            String fcmProjectId  = env.getProperty("app.push.fcm.project-id",    "");
            String fcmKeyFile    = env.getProperty("app.push.fcm.key-file",      "");
            // APNs (iOS)
            String apnsEnabled   = env.getProperty("app.push.apns.enabled",      "false");
            String apnsKeyId     = env.getProperty("app.push.apns.key-id",       "");
            String apnsTeamId    = env.getProperty("app.push.apns.team-id",      "");
            String apnsKeyFile   = env.getProperty("app.push.apns.key-file",     "");
            String apnsBundleId  = env.getProperty("app.push.apns.bundle-id",    "");
            String nc = "(not configured)";
            logTable("🔔 푸시 알림 — FCM (Android)", new String[][]{
                {"Enabled",    fcmEnabled,                               "application-{profile}.yml app.push.fcm.enabled"},
                {"Project ID", fcmProjectId.isBlank() ? nc : fcmProjectId, "sy_prop ^local^dev^ app.push.fcm.project-id"},
                {"Key File",   fcmKeyFile.isBlank()   ? nc : fcmKeyFile,   "sy_prop app.push.fcm.key-file  (서비스 계정 JSON 경로)"},
            });
            logTable("🍎 푸시 알림 — APNs (iOS)", new String[][]{
                {"Enabled",    apnsEnabled,                                  "application-{profile}.yml app.push.apns.enabled"},
                {"Key ID",     apnsKeyId.isBlank()    ? nc : apnsKeyId,     "sy_prop ^local^dev^ app.push.apns.key-id"},
                {"Team ID",    apnsTeamId.isBlank()   ? nc : apnsTeamId,    "sy_prop ^local^dev^ app.push.apns.team-id"},
                {"Key File",   apnsKeyFile.isBlank()  ? nc : apnsKeyFile,   "sy_prop app.push.apns.key-file  (.p8 경로)"},
                {"Bundle ID",  apnsBundleId.isBlank() ? nc : apnsBundleId,  "sy_prop app.push.apns.bundle-id"},
            });
        } catch (Exception e) {
            log.warn("❌ [Push] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /** checkChatConfiguration — 채팅/AI 설정 */
    private static void checkChatConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            // WebSocket
            String wsEnabled   = env.getProperty("app.chat.ws.enabled",        "false");
            String wsEndpoint  = env.getProperty("app.chat.ws.endpoint",       "");
            String wsOrigins   = env.getProperty("app.chat.ws.allowed-origins","");
            // Kakao 채널 (카카오톡 상담)
            String kakaoChEnabled  = env.getProperty("app.chat.kakao.enabled",      "false");
            String kakaoChKey      = env.getProperty("app.chat.kakao.channel-key",  "");
            // AI 챗봇
            String aiEnabled   = env.getProperty("app.chat.ai.enabled",        "false");
            String aiProvider  = env.getProperty("app.chat.ai.provider",       "");
            String aiApiKey    = env.getProperty("app.chat.ai.api-key",        "");
            String aiModel     = env.getProperty("app.chat.ai.model",          "");
            String nc = "(not configured)";
            logTable("💬 채팅 — WebSocket", new String[][]{
                {"Enabled",         wsEnabled,                              "application-{profile}.yml app.chat.ws.enabled"},
                {"Endpoint",        wsEndpoint.isBlank()  ? nc : wsEndpoint,  "sy_prop app.chat.ws.endpoint"},
                {"Allowed Origins", wsOrigins.isBlank()   ? nc : wsOrigins,   "sy_prop app.chat.ws.allowed-origins"},
            });
            logTable("💬 채팅 — Kakao 채널", new String[][]{
                {"Enabled",     kakaoChEnabled,                               "application-{profile}.yml app.chat.kakao.enabled"},
                {"Channel Key", kakaoChKey.isBlank() ? nc : kakaoChKey,      "sy_prop ^local^dev^ app.chat.kakao.channel-key"},
            });
            logTable("🤖 AI 챗봇", new String[][]{
                {"Enabled",   aiEnabled,                              "application-{profile}.yml app.chat.ai.enabled"},
                {"Provider",  aiProvider.isBlank() ? nc : aiProvider, "sy_prop app.chat.ai.provider  (openai / claude / gemini)"},
                {"API Key",   aiApiKey.isBlank()   ? nc : maskMiddle(aiApiKey), "sy_prop ^local^dev^ app.chat.ai.api-key"},
                {"Model",     aiModel.isBlank()    ? nc : aiModel,    "sy_prop app.chat.ai.model  (gpt-4o / claude-sonnet-4-6 등)"},
            });
        } catch (Exception e) {
            log.warn("❌ [Chat] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /** checkMailConfiguration — SMTP 설정 상태 출력 */
    private static void checkMailConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String host     = env.getProperty("spring.mail.host",     "");
            String port     = env.getProperty("spring.mail.port",     "");
            String username = env.getProperty("spring.mail.username", "");
            String password = env.getProperty("spring.mail.password", "");
            String from     = env.getProperty("app.mail.from",        "");
            String fromNm   = env.getProperty("app.mail.from-nm",     "");
            String nc = "(not configured)";
            logTable("📧 SMTP 메일 설정", new String[][]{
                {"Host",     host.isBlank()     ? nc : host,                 "sy_prop ^local^dev^ site.email.smtp.host"},
                {"Port",     port.isBlank()     ? nc : port,                 "sy_prop ^local^dev^ site.email.smtp.port"},
                {"Username", username.isBlank() ? nc : username,             "application-{profile}.yml spring.mail.username"},
                {"Password", password.isBlank() ? nc : maskMiddle(password), "application-{profile}.yml spring.mail.password"},
                {"From",     (fromNm.isBlank() ? nc : fromNm) + " <" + (from.isBlank() ? nc : from) + ">", "app.mail.from / app.mail.from-nm"},
            });
        } catch (Exception e) {
            log.warn("❌ [SMTP 메일] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /**
     * 3열 표 형식 로그 출력.
     * rows 각 항목: { "키", "값", "출처" }  (출처 생략 가능 — 2원소면 빈칸)
     *
     * ┌─────────────────────────────────────────────────────────────────────────────────┐
     * │ ✅ DB 연결 성공                                                                  │
     * ├──────────────┬──────────────────────────────────┬──────────────────────────────┤
     * │ Driver       │ PostgreSQL JDBC Driver            │                              │
     * │ URL          │ jdbc:postgresql://host:1234/db    │                              │
     * └──────────────┴──────────────────────────────────┴──────────────────────────────┘
     */
    private static void logTable(String title, String[][] rows) {
        final int K = 16;   // 키 열 너비
        final int V = 38;   // 값 열 너비
        final int S = 32;   // 출처 열 너비
        final int TOTAL = K + V + S + 5; // "│k│v│s│" 구조

        String sep1 = "─".repeat(K) + "┬" + "─".repeat(V) + "┬" + "─".repeat(S);
        String sep2 = "─".repeat(K) + "┴" + "─".repeat(V) + "┴" + "─".repeat(S);
        log.info("┌" + "─".repeat(TOTAL) + "┐");
        log.info("│ {} │", pad(title, TOTAL - 2));
        log.info("├" + sep1 + "┤");
        for (String[] row : rows) {
            String key = row[0] != null ? row[0] : "";
            String val = row.length > 1 && row[1] != null ? row[1] : "";
            String src = row.length > 2 && row[2] != null ? row[2] : "";
            // 값이 길면 여러 줄로 분할
            java.util.List<String> vLines = splitTo(val, V - 1);
            java.util.List<String> sLines = splitTo(src, S - 1);
            int lines = Math.max(vLines.size(), sLines.size());
            for (int i = 0; i < lines; i++) {
                String k = pad(i == 0 ? key : "", K);
                String v = pad(i < vLines.size() ? vLines.get(i) : "", V - 1);
                String s = pad(i < sLines.size() ? sLines.get(i) : "", S - 1);
                log.info("│ {} │ {} │ {} │", k, v, s);
            }
        }
        log.info("└" + sep2 + "┘");
    }

    /** 문자열을 maxLen 단위로 잘라 List 반환 */
    private static java.util.List<String> splitTo(String s, int maxLen) {
        java.util.List<String> list = new java.util.ArrayList<>();
        if (s == null || s.isEmpty()) { list.add(""); return list; }
        int i = 0;
        while (i < s.length()) {
            int end = Math.min(i + maxLen, s.length());
            list.add(s.substring(i, end));
            i = end;
        }
        return list;
    }

    /** 문자열을 width 에 맞게 오른쪽 공백 패딩 */
    private static String pad(String s, int width) {
        if (s == null) s = "";
        if (s.length() >= width) return s;
        return s + " ".repeat(width - s.length());
    }

    /** maskMiddle — 가운데 3자리만 *** 로 치환 */
    private static String maskMiddle(String val) {
        if (val == null || val.isBlank()) return "(not configured)";
        if (val.length() <= 6) return "***";
        int mid = val.length() / 2;
        return val.substring(0, mid - 1) + "***" + val.substring(mid + 2);
    }

    /** maskSecret */
    private static String maskSecret(String secret) {
        if (secret == null || secret.isEmpty()) {
            return "(not configured)";
        }
        if (secret.length() <= 4) {
            return "****";
        }
        return secret.substring(0, 4) + "****";
    }
}
