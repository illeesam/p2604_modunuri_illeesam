package com.shopjoy.ecadminapi;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisCallback;
import org.springframework.data.redis.core.RedisTemplate;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
public class AppTableLog {

    private static String ACTIVE_PROFILE = "default";

    public static void run(ConfigurableApplicationContext ctx) {
        ACTIVE_PROFILE = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (ACTIVE_PROFILE.isBlank()) ACTIVE_PROFILE = "default";

        checkDatabaseConnection(ctx);
        checkRedisConnection(ctx);
        checkFileStorageConfiguration(ctx);
        checkExtSdkConfiguration(ctx);
        checkMailConfiguration(ctx);
        checkSmsConfiguration(ctx);
        checkPushConfiguration(ctx);
        checkChatConfiguration(ctx);
    }

    /* ##### [01] DB 연결 #################################################### */

    private static void checkDatabaseConnection(ConfigurableApplicationContext ctx) {
        try {
            DataSource dataSource = ctx.getBean(DataSource.class);
            try (Connection conn = dataSource.getConnection()) {
                if (conn == null || conn.isClosed()) {
                    log.error("❌ [DB 연결 실패] Connection is null or closed");
                    return;
                }
                String dbUrl    = conn.getMetaData().getURL();
                String dbDriver = conn.getMetaData().getDriverName();
                String dbName   = extractDatabaseName(dbUrl);
                String username = conn.getMetaData().getUserName();
                logTable("✅ DB 연결 성공", new String[][]{
                    {"Driver",   dbDriver,    ""},
                    {"URL",      dbUrl,       ""},
                    {"Database", dbName,      ""},
                    {"Username", username,    ""},
                    {"Status",   "Connected", ""},
                });
            }
        } catch (Exception e) {
            log.error("❌ [DB 연결 실패] {}", e.getMessage(), e);
        }
    }

    private static String extractDatabaseName(String url) {
        try {
            if (url.contains("postgresql") || url.contains("mysql")) {
                String[] parts = url.split("/");
                if (parts.length > 3) return parts[3].split("\\?")[0];
            }
        } catch (Exception ignored) {}
        return "unknown";
    }

    /* ##### [02] Redis 연결 #################################################### */

    private static void checkRedisConnection(ConfigurableApplicationContext ctx) {
        try {
            RedisTemplate<String, Object> tpl = ctx.getBean("primaryRedisTemplate", RedisTemplate.class);
            LettuceConnectionFactory factory  = (LettuceConnectionFactory) tpl.getConnectionFactory();
            String ping = factory.getConnection().ping();
            if (!"PONG".equals(ping)) {
                log.error("❌ [Redis 연결 실패] Unexpected ping response: {}", ping);
                return;
            }
            String version = "unknown";
            try {
                Object info = tpl.execute((RedisCallback<Object>) c -> c.info("server"));
                if (info != null) {
                    for (String line : info.toString().split("\\r?\\n")) {
                        if (line.contains("redis_version:")) { version = line.split(":")[1].trim(); break; }
                    }
                }
            } catch (Exception ignored) {}
            String host     = factory.getStandaloneConfiguration().getHostName();
            int    port     = factory.getStandaloneConfiguration().getPort();
            int    database = factory.getStandaloneConfiguration().getDatabase();
            logTable("✅ Redis 연결 성공", new String[][]{
                {"Host",     host,                    ""},
                {"Port",     String.valueOf(port),    ""},
                {"Database", String.valueOf(database), ""},
                {"Version",  version,                 ""},
                {"Status",   "Connected",             ""},
            });
        } catch (Exception e) {
            boolean enabled = ctx.getEnvironment().getProperty("app.redis.enabled", Boolean.class, false);
            if (!enabled) log.info("⊘  [Redis] 비활성화 상태 (app.redis.enabled=false)");
            else          log.error("❌ [Redis 연결 실패] {}", e.getMessage());
        }
    }

    /* ##### [03] 파일 스토리지 #################################################### */

    private static void checkFileStorageConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String storageType  = env.getProperty("app.file.storage-type", "LOCAL");
            String cdnHost      = env.getProperty("app.file.cdn-host", "");
            String thumbEnabled = env.getProperty("app.file.thumbnail-enabled", "true");

            List<String[]> rows = new ArrayList<>();
            rows.add(new String[]{"Storage Type", storageType, "application-{profile}.yml : app.file.storage-type"});
            switch (storageType.toUpperCase()) {
                case "LOCAL" -> {
                    rows.add(new String[]{"Base Path",  env.getProperty("app.file.local.base-path",  "static/cdn"), "application-{profile}.yml : app.file.local.base-path"});
                    rows.add(new String[]{"Upload Dir", env.getProperty("app.file.local.upload-dir", "uploads"),    "application-{profile}.yml : app.file.local.upload-dir"});
                    rows.add(new String[]{"Status",     "Local Storage Active", ""});
                }
                case "AWS_S3" -> {
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.aws.bucket-name", ""), "application-{profile}.yml : app.file.aws.bucket-name"});
                    rows.add(new String[]{"Region",     env.getProperty("app.file.aws.region", "ap-northeast-2"), "application-{profile}.yml : app.file.aws.region"});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.aws.cdn-url", ""), "application-{profile}.yml : app.file.aws.cdn-url"});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.aws.access-key", "")), "application-{profile}.yml : app.file.aws.access-key"});
                    rows.add(new String[]{"Status",     "AWS S3 Active", ""});
                }
                case "NCP_OBS" -> {
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.ncp.bucket-name", ""), "application-{profile}.yml : app.file.ncp.bucket-name"});
                    rows.add(new String[]{"Endpoint",   env.getProperty("app.file.ncp.endpoint",    ""), "application-{profile}.yml : app.file.ncp.endpoint"});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.ncp.cdn-url",     ""), "application-{profile}.yml : app.file.ncp.cdn-url"});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.ncp.access-key", "")), "application-{profile}.yml : app.file.ncp.access-key"});
                    rows.add(new String[]{"Status",     "NCP OBS Active", ""});
                }
                default -> rows.add(new String[]{"Status", "Unknown: " + storageType, ""});
            }
            logTable("📁 파일 스토리지 설정", rows.toArray(new String[0][]));
            logTable("🌐 CDN / 정적 파일", new String[][]{
                {"CDN Host",  cdnHost.isBlank() ? "(not configured)" : cdnHost, "sy_prop : cdn.url.base"},
                {"Thumbnail", thumbEnabled, "application-{profile}.yml : app.file.thumbnail-enabled"},
            });
        } catch (Exception e) {
            log.warn("❌ [파일 스토리지] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [04] 외부 SDK (소셜/결제/지도) #################################################### */

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
                {"Client ID", googleClientId.isBlank() ? nc : googleClientId, "sy_prop ^local^dev^ : ext.sdk.googleClientId", googleClientId.isBlank() ? "⚠ FO/BO 구글 로그인 버튼 미작동" : ""},
            });
            logTable("👤 소셜 로그인 — Kakao", new String[][]{
                {"JS Key", kakaoJsKey.isBlank() ? nc : kakaoJsKey, "sy_prop ^local^dev^ : ext.sdk.kakaoJsKey", kakaoJsKey.isBlank() ? "⚠ FO/BO 카카오 로그인 버튼 미작동" : ""},
            });
            logTable("👤 소셜 로그인 — Naver", new String[][]{
                {"Client ID", naverClientId.isBlank() ? nc : naverClientId, "sy_prop ^local^dev^ : ext.sdk.naverClientId",    naverClientId.isBlank() ? "⚠ FO/BO 네이버 로그인 버튼 미작동" : ""},
                {"Callback",  naverCbUrl.isBlank()    ? nc : naverCbUrl,    "sy_prop ^local^dev^ : ext.sdk.naverCallbackUrl", naverCbUrl.isBlank() ? "⚠ FO/BO 네이버 로그인 콜백 미설정" : ""},
            });
            logTable("💳 결제 (Toss Payments)", new String[][]{
                {"Client Key",  tossClientKey.isBlank()  ? nc : tossClientKey,                   "sy_prop : payment.toss.client_key",  tossClientKey.isBlank()  ? "⚠ FO/BO 결제 버튼 미작동" : ""},
                {"Secret Key",  "(runtime)",                                                       "sy_prop : payment.toss.secret_key",  "런타임 조회 — 미설정 시 결제승인 실패"},
                {"Confirm URL", "(runtime)",                                                       "sy_prop : payment.toss.confirm_url", "런타임 조회 — 미설정 시 결제승인 콜백 실패"},
                {"Cancel URL",  "(runtime)",                                                       "sy_prop : payment.toss.cancel_url",  "런타임 조회 — 미설정 시 환불 요청 실패"},
                {"Success URL", tossSuccessUrl.isBlank() ? "(프론트 직접 전달)" : tossSuccessUrl, "coExtSdk.js : opts.successUrl",      "FO 결제창에서 직접 전달 (서버 불필요)"},
                {"Fail URL",    tossFailUrl.isBlank()    ? "(프론트 직접 전달)" : tossFailUrl,    "coExtSdk.js : opts.failUrl",         "FO 결제창에서 직접 전달 (서버 불필요)"},
            });
            logTable("🗺  지도 API — Kakao", new String[][]{
                {"JS Key", kakaoMapJsKey.isBlank() ? nc : kakaoMapJsKey, "sy_prop ^local^dev^ : ext.sdk.kakaoMapJsKey", kakaoMapJsKey.isBlank() ? "⚠ FO 매장위치(지도) 페이지 미작동" : ""},
            });
            logTable("🗺  지도 API — Naver", new String[][]{
                {"Client ID", naverMapId.isBlank() ? nc : naverMapId, "sy_prop ^local^dev^ : ext.sdk.naverMapClientId", naverMapId.isBlank() ? "⚠ FO 매장위치(지도) 페이지 미작동" : ""},
            });
        } catch (Exception e) {
            log.warn("❌ [외부 SDK 키] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [05] SMTP 메일 #################################################### */

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
                {"Host",     host.isBlank()     ? nc : host,                  "sy_prop ^local^dev^ : site.email.smtp.host",       host.isBlank()     ? "⚠ FO/BO 이메일 발송 전체 실패" : ""},
                {"Port",     port.isBlank()     ? nc : port,                  "sy_prop ^local^dev^ : site.email.smtp.port",       port.isBlank()     ? "⚠ SMTP 포트 미설정 (기본 587)" : ""},
                {"Username", username.isBlank() ? nc : username,              "application-{profile}.yml : spring.mail.username", username.isBlank() ? "⚠ SMTP 인증 실패" : ""},
                {"Password", password.isBlank() ? nc : maskMiddle(password),  "application-{profile}.yml : spring.mail.password", password.isBlank() ? "⚠ SMTP 인증 실패" : ""},
                {"From",     (fromNm.isBlank() ? nc : fromNm) + " <" + (from.isBlank() ? nc : from) + ">", "app.mail.from / app.mail.from-nm", (from.isBlank() || fromNm.isBlank()) ? "⚠ FO 발신자 표시명/주소 미설정" : ""},
            });
        } catch (Exception e) {
            log.warn("❌ [SMTP 메일] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [06] SMS #################################################### */

    private static void checkSmsConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String provider  = env.getProperty("app.sms.provider",   "");
            String apiKey    = env.getProperty("app.sms.api-key",    "");
            String apiSecret = env.getProperty("app.sms.api-secret", "");
            String from      = env.getProperty("app.sms.from",       "");
            String enabled   = env.getProperty("app.sms.enabled",    "false");
            String nc = "(not configured)";
            logTable("📱 SMS 문자 발송", new String[][]{
                {"Enabled",    enabled,                               "application-{profile}.yml : app.sms.enabled",             "false=발송 비활성 (FO/BO SMS 전송 전체 스킵)"},
                {"Provider",   provider.isBlank()  ? nc : provider,  "sy_prop : app.sms.provider (aligo/coolsms/ncp/twilio)",    provider.isBlank()  ? "⚠ FO 주문/회원 SMS 발송 미작동" : ""},
                {"API Key",    apiKey.isBlank()    ? nc : apiKey,    "sy_prop ^local^dev^ : app.sms.api-key",                    apiKey.isBlank()    ? "⚠ FO/BO SMS 인증 실패" : ""},
                {"API Secret", apiSecret.isBlank() ? nc : maskMiddle(apiSecret), "sy_prop ^local^dev^ : app.sms.api-secret",     apiSecret.isBlank() ? "⚠ FO/BO SMS 인증 실패" : ""},
                {"From",       from.isBlank()      ? nc : from,      "sy_prop : app.sms.from (발신번호)",                        from.isBlank()      ? "⚠ FO 발신번호 미설정 — 통신사 차단" : ""},
            });
        } catch (Exception e) {
            log.warn("❌ [SMS] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [07] 푸시 알림 #################################################### */

    private static void checkPushConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String fcmEnabled   = env.getProperty("app.push.fcm.enabled",    "false");
            String fcmProjectId = env.getProperty("app.push.fcm.project-id", "");
            String fcmKeyFile   = env.getProperty("app.push.fcm.key-file",   "");
            String apnsEnabled  = env.getProperty("app.push.apns.enabled",   "false");
            String apnsKeyId    = env.getProperty("app.push.apns.key-id",    "");
            String apnsTeamId   = env.getProperty("app.push.apns.team-id",   "");
            String apnsKeyFile  = env.getProperty("app.push.apns.key-file",  "");
            String apnsBundleId = env.getProperty("app.push.apns.bundle-id", "");
            String nc = "(not configured)";
            logTable("🔔 푸시 알림 — FCM (Android)", new String[][]{
                {"Enabled",    fcmEnabled,                                  "application-{profile}.yml : app.push.fcm.enabled",       "false=Android 앱 푸시 전체 비활성"},
                {"Project ID", fcmProjectId.isBlank() ? nc : fcmProjectId, "sy_prop ^local^dev^ : app.push.fcm.project-id",          fcmProjectId.isBlank() ? "⚠ Android 앱 푸시 알림 미발송" : ""},
                {"Key File",   fcmKeyFile.isBlank()   ? nc : fcmKeyFile,   "sy_prop : app.push.fcm.key-file (서비스 계정 JSON 경로)", fcmKeyFile.isBlank()   ? "⚠ Android 앱 푸시 알림 미발송" : ""},
            });
            logTable("🍎 푸시 알림 — APNs (iOS)", new String[][]{
                {"Enabled",   apnsEnabled,                                    "application-{profile}.yml : app.push.apns.enabled", "false=iOS 앱 푸시 전체 비활성"},
                {"Key ID",    apnsKeyId.isBlank()    ? nc : apnsKeyId,       "sy_prop ^local^dev^ : app.push.apns.key-id",        apnsKeyId.isBlank()    ? "⚠ iOS 앱 푸시 알림 미발송" : ""},
                {"Team ID",   apnsTeamId.isBlank()   ? nc : apnsTeamId,      "sy_prop ^local^dev^ : app.push.apns.team-id",       apnsTeamId.isBlank()   ? "⚠ iOS 앱 푸시 알림 미발송" : ""},
                {"Key File",  apnsKeyFile.isBlank()  ? nc : apnsKeyFile,     "sy_prop : app.push.apns.key-file (.p8 경로)",       apnsKeyFile.isBlank()  ? "⚠ iOS 앱 푸시 알림 미발송" : ""},
                {"Bundle ID", apnsBundleId.isBlank() ? nc : apnsBundleId,    "sy_prop : app.push.apns.bundle-id",                 apnsBundleId.isBlank() ? "⚠ iOS 앱 푸시 알림 미발송" : ""},
            });
        } catch (Exception e) {
            log.warn("❌ [Push] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [08] 채팅 / AI #################################################### */

    private static void checkChatConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String wsEnabled      = env.getProperty("app.chat.ws.enabled",         "false");
            String wsEndpoint     = env.getProperty("app.chat.ws.endpoint",        "");
            String wsOrigins      = env.getProperty("app.chat.ws.allowed-origins", "");
            String kakaoChEnabled = env.getProperty("app.chat.kakao.enabled",      "false");
            String kakaoChKey     = env.getProperty("app.chat.kakao.channel-key",  "");
            String aiEnabled      = env.getProperty("app.chat.ai.enabled",         "false");
            String aiProvider     = env.getProperty("app.chat.ai.provider",        "");
            String aiApiKey       = env.getProperty("app.chat.ai.api-key",         "");
            String aiModel        = env.getProperty("app.chat.ai.model",           "");
            String nc = "(not configured)";
            logTable("💬 채팅 — WebSocket", new String[][]{
                {"Enabled",         wsEnabled,                               "application-{profile}.yml : app.chat.ws.enabled",      "false=FO 실시간 채팅 전체 비활성"},
                {"Endpoint",        wsEndpoint.isBlank()  ? nc : wsEndpoint, "sy_prop : app.chat.ws.endpoint",                      wsEndpoint.isBlank()  ? "⚠ FO 실시간 채팅 미작동" : ""},
                {"Allowed Origins", wsOrigins.isBlank()   ? nc : wsOrigins,  "sy_prop : app.chat.ws.allowed-origins",               wsOrigins.isBlank()   ? "⚠ FO WebSocket CORS 차단" : ""},
            });
            logTable("💬 채팅 — Kakao 채널", new String[][]{
                {"Enabled",     kakaoChEnabled,                             "application-{profile}.yml : app.chat.kakao.enabled",    "false=FO 카카오 상담채널 비활성"},
                {"Channel Key", kakaoChKey.isBlank() ? nc : kakaoChKey,    "sy_prop ^local^dev^ : app.chat.kakao.channel-key",      kakaoChKey.isBlank() ? "⚠ FO 카카오 상담채널 버튼 미작동" : ""},
            });
            logTable("🤖 AI 챗봇", new String[][]{
                {"Enabled",  aiEnabled,                               "application-{profile}.yml : app.chat.ai.enabled",                    "false=FO AI 챗봇 전체 비활성"},
                {"Provider", aiProvider.isBlank() ? nc : aiProvider,  "sy_prop : app.chat.ai.provider (openai/claude/gemini)",              aiProvider.isBlank() ? "⚠ FO AI 챗봇 응답 불가" : ""},
                {"API Key",  aiApiKey.isBlank()   ? nc : maskMiddle(aiApiKey), "sy_prop ^local^dev^ : app.chat.ai.api-key",                 aiApiKey.isBlank()   ? "⚠ FO AI 챗봇 인증 실패" : ""},
                {"Model",    aiModel.isBlank()    ? nc : aiModel,     "sy_prop : app.chat.ai.model (gpt-4o/claude-sonnet-4-6 등)",         aiModel.isBlank()    ? "⚠ FO AI 챗봇 응답 불가" : ""},
            });
        } catch (Exception e) {
            log.warn("❌ [Chat] 설정 조회 실패 — {}", e.getMessage());
        }
    }

    /* ##### [09] logTable 렌더러 #################################################### */

    /**
     * 5열 표 형식 로그 출력: 키 │ 값 │ 출처유형 │ 환경태그 │ 키경로 [│ 비고]
     * rows 각 항목: { "키", "값", "출처" }  또는  { "키", "값", "출처", "비고" }
     */
    static void logTable(String title, String[][] rows) {
        boolean hasSrc  = false;
        boolean hasNote = false;
        for (String[] row : rows) {
            if (row.length > 2 && row[2] != null && !row[2].isBlank()) hasSrc  = true;
            if (row.length > 3 && row[3] != null && !row[3].isBlank()) hasNote = true;
        }

        String[][] aug = new String[rows.length][];
        for (int i = 0; i < rows.length; i++) {
            String[] r    = rows[i];
            String val    = r.length > 1 ? nvl(r[1]) : "";
            String src    = r.length > 2 ? nvl(r[2]) : "";
            String note   = r.length > 3 ? nvl(r[3]) : "";
            if (note.isBlank() && val.equals("(not configured)") && src.contains("sy_prop")) {
                note = "⚠ sy_prop 항목 없음 — BO 프로퍼티관리에서 등록 필요";
            }
            aug[i] = new String[]{ r.length > 0 ? nvl(r[0]) : "", val, src, note };
            if (!note.isBlank()) hasNote = true;
        }

        String[][] parsed = new String[rows.length][];
        for (int i = 0; i < rows.length; i++) parsed[i] = parseSrc(aug[i][2]);

        int kW = 14, vW = 40, s1W = 22, s2W = 13, s3W = 40, nW = 0;
        for (int i = 0; i < rows.length; i++) {
            kW  = Math.max(kW,  aug[i][0].length());
            vW  = Math.max(vW,  aug[i][1].length());
            if (hasSrc)  { s1W = Math.max(s1W, parsed[i][0].length()); s2W = Math.max(s2W, parsed[i][1].length()); s3W = Math.max(s3W, parsed[i][2].length()); }
            if (hasNote) { nW  = Math.max(nW,  aug[i][3].length()); }
        }
        if (hasNote) nW = Math.max(nW, 4);

        String sep1, sep2;
        int total;
        if (hasSrc && hasNote) {
            sep1  = r(kW) + "┬" + r(vW) + "┬" + r(s1W) + "┬" + r(s2W) + "┬" + r(s3W) + "┬" + r(nW);
            sep2  = r(kW) + "┴" + r(vW) + "┴" + r(s1W) + "┴" + r(s2W) + "┴" + r(s3W) + "┴" + r(nW);
            total = kW + vW + s1W + s2W + s3W + nW + 16;
        } else if (hasSrc) {
            sep1  = r(kW) + "┬" + r(vW) + "┬" + r(s1W) + "┬" + r(s2W) + "┬" + r(s3W);
            sep2  = r(kW) + "┴" + r(vW) + "┴" + r(s1W) + "┴" + r(s2W) + "┴" + r(s3W);
            total = kW + vW + s1W + s2W + s3W + 13;
        } else {
            sep1  = r(kW) + "┬" + r(vW);
            sep2  = r(kW) + "┴" + r(vW);
            total = kW + vW + 4;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("┌").append("─".repeat(total)).append("┐\n");
        sb.append("│ ").append(pad(title, total - 2)).append(" │\n");
        sb.append("├").append(sep1).append("┤\n");
        for (int i = 0; i < aug.length; i++) {
            String k = aug[i][0], v = aug[i][1], n = aug[i][3];
            if (hasSrc && hasNote) {
                sb.append("│ ").append(pad(k, kW)).append(" │ ").append(pad(v, vW))
                  .append(" │ ").append(pad(parsed[i][0], s1W)).append(" │ ").append(pad(parsed[i][1], s2W))
                  .append(" │ ").append(pad(parsed[i][2], s3W)).append(" │ ").append(pad(n, nW)).append(" │\n");
            } else if (hasSrc) {
                sb.append("│ ").append(pad(k, kW)).append(" │ ").append(pad(v, vW))
                  .append(" │ ").append(pad(parsed[i][0], s1W)).append(" │ ").append(pad(parsed[i][1], s2W))
                  .append(" │ ").append(pad(parsed[i][2], s3W)).append(" │\n");
            } else {
                sb.append("│ ").append(pad(k, kW)).append(" │ ").append(pad(v, vW)).append(" │\n");
            }
        }
        sb.append("└").append(sep2).append("┘");
        log.info("\n{}", sb);
    }

    /* ##### [10] 내부 헬퍼 #################################################### */

    /**
     * 출처 문자열을 [유형, 환경태그, 키경로] 3개로 파싱.
     * "유형 : 키"  |  "유형 ^태그^ : 키"  |  기타
     */
    private static String[] parseSrc(String raw) {
        if (raw == null || raw.isBlank()) return new String[]{"", "", ""};
        raw = raw.replace("{profile}", ACTIVE_PROFILE);

        int sep = raw.indexOf(" : ");
        if (sep < 0) return new String[]{"", "", raw.trim()};

        String left = raw.substring(0, sep).trim();
        String key  = raw.substring(sep + 3).trim();

        if (left.startsWith("sy_prop")) {
            String rest = left.substring("sy_prop".length()).trim();
            return new String[]{"sy_prop", rest.startsWith("^") ? rest : "", key};
        }
        if (left.endsWith(".yml")) {
            String tag = "";
            Matcher m = Pattern.compile("application-([^.]+)\\.yml").matcher(left);
            if (m.find()) tag = m.group(1);
            return new String[]{left, tag, key};
        }
        return new String[]{left, "", key};
    }

    /** "─".repeat(width + 2) 단축 */
    private static String r(int w) { return "─".repeat(w + 2); }

    /** null-safe 빈 문자열 */
    private static String nvl(String s) { return s != null ? s : ""; }

    /** 오른쪽 공백 패딩 */
    private static String pad(String s, int width) {
        if (s == null) s = "";
        return s.length() >= width ? s : s + " ".repeat(width - s.length());
    }

    /** 가운데 마스킹 */
    private static String maskMiddle(String val) {
        if (val == null || val.isBlank()) return "(not configured)";
        if (val.length() <= 6) return "***";
        int mid = val.length() / 2;
        return val.substring(0, mid - 1) + "***" + val.substring(mid + 2);
    }

    /** 앞 4자 + **** 마스킹 */
    private static String maskSecret(String secret) {
        if (secret == null || secret.isEmpty()) return "(not configured)";
        if (secret.length() <= 4) return "****";
        return secret.substring(0, 4) + "****";
    }
}
