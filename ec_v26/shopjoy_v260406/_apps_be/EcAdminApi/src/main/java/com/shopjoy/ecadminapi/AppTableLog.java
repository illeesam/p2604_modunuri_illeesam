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
        checkAuthConfiguration(ctx);
        checkFileStorageConfiguration(ctx);
        checkSocialLoginConfiguration(ctx);
        checkPaymentConfiguration(ctx);
        checkMapConfiguration(ctx);
        checkMailConfiguration(ctx);
        checkSmsConfiguration(ctx);
        checkPushConfiguration(ctx);
        checkChatConfiguration(ctx);
        checkAiConfiguration(ctx);
        checkLicenseConfiguration(ctx);
        checkJwtConfiguration(ctx);
    }

    /* ##### [01] DB #################################################### */

    private static void checkDatabaseConnection(ConfigurableApplicationContext ctx) {
        try {
            DataSource dataSource = ctx.getBean(DataSource.class);
            try (Connection conn = dataSource.getConnection()) {
                if (conn == null || conn.isClosed()) {
                    log.error("[DB] Connection is null or closed");
                    return;
                }
                String dbUrl    = conn.getMetaData().getURL();
                String dbDriver = conn.getMetaData().getDriverName();
                String dbName   = extractDatabaseName(dbUrl);
                String username = conn.getMetaData().getUserName();
                logTable("DB Connection", new String[][]{
                    {"Driver",   dbDriver,    ""},
                    {"URL",      dbUrl,       ""},
                    {"Database", dbName,      ""},
                    {"Username", username,    ""},
                    {"Status",   "Connected", ""},
                });
            }
        } catch (Exception e) {
            log.error("[DB] Connection failed — {}", e.getMessage(), e);
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

    /* ##### [02] Redis #################################################### */

    @SuppressWarnings("unchecked")
    private static void checkRedisConnection(ConfigurableApplicationContext ctx) {
        try {
            RedisTemplate<String, Object> tpl = (RedisTemplate<String, Object>)
                ctx.getBean("primaryRedisTemplate", RedisTemplate.class);
            LettuceConnectionFactory factory = (LettuceConnectionFactory) tpl.getConnectionFactory();
            if (factory == null) { log.error("[Redis] ConnectionFactory is null"); return; }
            String ping = factory.getConnection().ping();
            if (!"PONG".equals(ping)) {
                log.error("[Redis] Unexpected ping response: {}", ping);
                return;
            }
            String version = "unknown";
            try {
                // c.info(String) is deprecated in newer lettuce — use execute with Properties API as fallback
                Object info = tpl.execute((RedisCallback<Object>) c -> {
                    try { return c.serverCommands().info("server"); }
                    catch (Exception ex) { return null; }
                });
                if (info != null) {
                    for (String line : info.toString().split("\\r?\\n")) {
                        if (line.contains("redis_version:")) { version = line.split(":")[1].trim(); break; }
                    }
                }
            } catch (Exception ignored) {}
            String host     = factory.getStandaloneConfiguration().getHostName();
            int    port     = factory.getStandaloneConfiguration().getPort();
            int    database = factory.getStandaloneConfiguration().getDatabase();
            logTable("Redis Connection", new String[][]{
                {"Host",     host,                    ""},
                {"Port",     String.valueOf(port),    ""},
                {"Database", String.valueOf(database), ""},
                {"Version",  version,                 ""},
                {"Status",   "Connected",             ""},
            });
        } catch (Exception e) {
            boolean enabled = ctx.getEnvironment().getProperty("app.redis.enabled", Boolean.class, false);
            if (!enabled) log.info("[Redis] Disabled (app.redis.enabled=false)");
            else          log.error("[Redis] Connection failed — {}", e.getMessage());
        }
    }

    /* ##### [03] Auth / JWT #################################################### */

    private static void checkAuthConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String masterEnabled = env.getProperty("auth.master-pwd.enabled", "true");
            String jwtSecret     = env.getProperty("jwt.secret", "");
            String nc = "(not configured)";
            logTable("Auth / Master Password", new String[][]{
                {"Master Pwd", masterEnabled, "application-{profile}.yml : auth.master-pwd.enabled",
                    "true=dev only, prod must be false"},
                {"JWT Secret", jwtSecret.isBlank() ? nc : maskMiddle(jwtSecret),
                    "application-{profile}.yml : jwt.secret",
                    jwtSecret.isBlank() ? "application-{profile}.yml에 jwt.secret 값 설정 필요" : ""},
            });
        } catch (Exception e) {
            log.warn("[Auth] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [04] JWT Token Expiry #################################################### */

    private static void checkJwtConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String boAccess  = env.getProperty("jwt.bo-access-expiry",  "");
            String foAccess  = env.getProperty("jwt.fo-access-expiry",  "");
            String boRefresh = env.getProperty("jwt.bo-refresh-expiry", "");
            String foRefresh = env.getProperty("jwt.fo-refresh-expiry", "");
            logTable("JWT Token Expiry", new String[][]{
                {"BO Access",  fmtMs(boAccess),  "application-{profile}.yml : jwt.bo-access-expiry",  ""},
                {"FO Access",  fmtMs(foAccess),  "application-{profile}.yml : jwt.fo-access-expiry",  ""},
                {"BO Refresh", fmtMs(boRefresh), "application-{profile}.yml : jwt.bo-refresh-expiry", ""},
                {"FO Refresh", fmtMs(foRefresh), "application-{profile}.yml : jwt.fo-refresh-expiry", ""},
            });
        } catch (Exception e) {
            log.warn("[JWT] Config check failed — {}", e.getMessage());
        }
    }

    private static String fmtMs(String ms) {
        if (ms == null || ms.isBlank()) return "(not configured)";
        try {
            long v = Long.parseLong(ms);
            if (v >= 86400000) return v / 86400000 + "d (" + ms + "ms)";
            if (v >= 3600000)  return v / 3600000  + "h (" + ms + "ms)";
            if (v >= 60000)    return v / 60000     + "m (" + ms + "ms)";
            return v / 1000 + "s (" + ms + "ms)";
        } catch (NumberFormatException e) {
            return ms;
        }
    }

    /* ##### [05] File Storage #################################################### */

    private static void checkFileStorageConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String storageType  = env.getProperty("app.file.storage-type", "LOCAL");
            String cdnHost      = env.getProperty("app.file.cdn-host", "");
            String thumbEnabled = env.getProperty("app.file.thumbnail-enabled", "true");
            String thumbSizes   = env.getProperty("app.file.thumbnail-sizes", "");
            String nc = "(not configured)";

            List<String[]> rows = new ArrayList<>();
            rows.add(new String[]{"Storage Type", storageType,
                "application-{profile}.yml : app.file.storage-type", ""});
            rows.add(new String[]{"CDN Host", cdnHost.isBlank() ? nc : cdnHost,
                "application-{profile}.yml : app.file.cdn-host",
                cdnHost.isBlank() ? "CDN 미설정 시 정적 파일은 상대경로 사용 (운영환경 설정 권장)" : ""});
            rows.add(new String[]{"Thumbnail", thumbEnabled,
                "application-{profile}.yml : app.file.thumbnail-enabled", ""});
            rows.add(new String[]{"Thumb Sizes", thumbSizes.isBlank() ? nc : thumbSizes,
                "application-{profile}.yml : app.file.thumbnail-sizes", ""});

            switch (storageType.toUpperCase()) {
                case "LOCAL" -> {
                    rows.add(new String[]{"Base Path",  env.getProperty("app.file.local.base-path",  "static/cdn"),
                        "application-{profile}.yml : app.file.local.base-path", ""});
                    rows.add(new String[]{"Upload Dir", env.getProperty("app.file.local.upload-dir", "uploads"),
                        "application-{profile}.yml : app.file.local.upload-dir", ""});
                    rows.add(new String[]{"Status", "Local Storage Active", "", ""});
                }
                case "AWS_S3" -> {
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.aws.bucket-name", nc),
                        "application-{profile}.yml : app.file.aws.bucket-name",
                        env.getProperty("app.file.aws.bucket-name", "").isBlank() ? "AWS S3 콘솔에서 버킷 생성 후 이름 입력" : ""});
                    rows.add(new String[]{"Region",     env.getProperty("app.file.aws.region", "ap-northeast-2"),
                        "application-{profile}.yml : app.file.aws.region", ""});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.aws.cdn-url", nc),
                        "application-{profile}.yml : app.file.aws.cdn-url", ""});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.aws.access-key", "")),
                        "application-{profile}.yml : app.file.aws.access-key",
                        env.getProperty("app.file.aws.access-key", "").isBlank() ? "AWS IAM → 액세스 키 발급 후 yml에 입력" : ""});
                    rows.add(new String[]{"Status", "AWS S3 Active", "", ""});
                }
                case "NCP_OBS" -> {
                    rows.add(new String[]{"Bucket",     env.getProperty("app.file.ncp.bucket-name", nc),
                        "application-{profile}.yml : app.file.ncp.bucket-name",
                        env.getProperty("app.file.ncp.bucket-name", "").isBlank() ? "NCP Object Storage 콘솔에서 버킷 생성 후 입력" : ""});
                    rows.add(new String[]{"Endpoint",   env.getProperty("app.file.ncp.endpoint", nc),
                        "application-{profile}.yml : app.file.ncp.endpoint", ""});
                    rows.add(new String[]{"CDN URL",    env.getProperty("app.file.ncp.cdn-url", nc),
                        "application-{profile}.yml : app.file.ncp.cdn-url", ""});
                    rows.add(new String[]{"Access Key", maskSecret(env.getProperty("app.file.ncp.access-key", "")),
                        "application-{profile}.yml : app.file.ncp.access-key",
                        env.getProperty("app.file.ncp.access-key", "").isBlank() ? "NCP 포털 → 인증키 관리에서 Access Key 발급 후 입력" : ""});
                    rows.add(new String[]{"Status", "NCP OBS Active", "", ""});
                }
                default -> rows.add(new String[]{"Status", "Unknown: " + storageType, "", "LOCAL / AWS_S3 / NCP_OBS 중 하나로 변경 필요"});
            }
            logTable("File Storage", rows.toArray(new String[0][]));
        } catch (Exception e) {
            log.warn("[File Storage] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [06] Social Login #################################################### */

    private static void checkSocialLoginConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String googleClientId    = env.getProperty("app.auth.social.google-client-id",    "");
            String googleUserinfoUrl = env.getProperty("app.auth.social.google-userinfo-url", "");
            String kakaoJsKey        = env.getProperty("app.auth.social.kakao-js-key",        "");
            String kakaoUserinfoUrl  = env.getProperty("app.auth.social.kakao-userinfo-url",  "");
            String naverClientId     = env.getProperty("app.auth.social.naver-client-id",     "");
            String naverClientSecret = env.getProperty("app.auth.social.naver-client-secret", "");
            String naverCbUrl        = env.getProperty("app.auth.social.naver-callback-url",  "");
            String naverUserinfoUrl  = env.getProperty("app.auth.social.naver-userinfo-url",  "");
            String defaultSiteId     = env.getProperty("app.auth.social.default-site-id",     "");
            String nc = "(not configured)";

            logTable("Social Login - Google", new String[][]{
                {"Client ID",    googleClientId.isBlank()    ? nc : maskSecret(googleClientId),
                    "sy_prop ^local^dev^ : app.auth.social.google-client-id",
                    googleClientId.isBlank() ? "Google Cloud Console → 사용자 인증정보 → OAuth 2.0 클라이언트 ID 발급 후 입력" : ""},
                {"Userinfo URL", googleUserinfoUrl.isBlank() ? "(default)" : googleUserinfoUrl,
                    "sy_prop : app.auth.social.google-userinfo-url",
                    googleUserinfoUrl.isBlank() ? "기본값: https://www.googleapis.com/oauth2/v3/userinfo" : ""},
            });
            logTable("Social Login - Kakao", new String[][]{
                {"JS Key",       kakaoJsKey.isBlank()       ? nc : maskSecret(kakaoJsKey),
                    "sy_prop ^local^dev^ : app.auth.social.kakao-js-key",
                    kakaoJsKey.isBlank() ? "Kakao Developers → 내 애플리케이션 → 앱 키 → JavaScript 키 입력" : ""},
                {"Userinfo URL", kakaoUserinfoUrl.isBlank() ? "(default)" : kakaoUserinfoUrl,
                    "sy_prop : app.auth.social.kakao-userinfo-url",
                    kakaoUserinfoUrl.isBlank() ? "기본값: https://kapi.kakao.com/v2/user/me" : ""},
            });
            logTable("Social Login - Naver", new String[][]{
                {"Client ID",    naverClientId.isBlank()     ? nc : maskSecret(naverClientId),
                    "sy_prop ^local^dev^ : app.auth.social.naver-client-id",
                    naverClientId.isBlank() ? "Naver Developers → 애플리케이션 → Client ID 발급 후 입력" : ""},
                {"Client Secret",naverClientSecret.isBlank() ? nc : "***",
                    "sy_prop ^local^dev^ : app.auth.social.naver-client-secret",
                    naverClientSecret.isBlank() ? "Naver Developers → 애플리케이션 → Client Secret 발급 후 입력" : ""},
                {"Callback URL", naverCbUrl.isBlank()        ? nc : naverCbUrl,
                    "sy_prop ^local^dev^ : app.auth.social.naver-callback-url",
                    naverCbUrl.isBlank() ? "네이버 앱 설정 → 로그인 Callback URL에 서버 주소 등록 후 입력" : ""},
                {"Userinfo URL", naverUserinfoUrl.isBlank()  ? "(default)" : naverUserinfoUrl,
                    "sy_prop : app.auth.social.naver-userinfo-url",
                    naverUserinfoUrl.isBlank() ? "기본값: https://openapi.naver.com/v1/nid/me" : ""},
            });
            logTable("Social Login - Common", new String[][]{
                {"Default Site", defaultSiteId.isBlank() ? nc : defaultSiteId,
                    "sy_prop : app.auth.social.default-site-id",
                    defaultSiteId.isBlank() ? "BO → 시스템 설정 → 사이트 관리에서 기본 site_id 확인 후 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[Social Login] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [07] Payment #################################################### */

    private static void checkPaymentConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String tossClientKey  = env.getProperty("app.pay.toss.widget-client-key", "");
            String kakaoPayCid    = env.getProperty("app.pay.kakaopay.cid",           "");
            String naverPayId     = env.getProperty("app.pay.naverpay.client-id",     "");
            String naverPayApiUrl = env.getProperty("app.pay.naverpay.api-url",       "");
            String nc = "(not configured)";

            logTable("Payment - Toss Payments", new String[][]{
                {"Client Key",   tossClientKey.isBlank() ? nc : maskSecret(tossClientKey),
                    "sy_prop : app.pay.toss.widget-client-key",
                    tossClientKey.isBlank() ? "토스페이먼츠 개발자센터 → 내 상점 → 클라이언트 키 발급 후 입력" : ""},
                {"Secret Key",   "(runtime only)",
                    "sy_prop : app.pay.toss.secret-key",
                    "미설정 시 결제 승인 실패 — 토스페이먼츠 개발자센터에서 시크릿 키 발급"},
                {"Confirm URL",  "(runtime only)",
                    "sy_prop : app.pay.toss.confirm-url",
                    "미설정 시 결제 콜백 실패 — 서버 도메인 + /api/co/cm/toss/confirm 경로 입력"},
                {"Cancel URL",   "(runtime only)",
                    "sy_prop : app.pay.toss.cancel-url-base",
                    "미설정 시 환불 요청 실패 — 서버 도메인 + /api/co/cm/toss/cancel 경로 입력"},
                {"Success URL",  "(passed from frontend)",
                    "coExtSdk.js : opts.successUrl",
                    "FO 결제 위젯에서 직접 전달 — 서버 설정 불필요"},
                {"Fail URL",     "(passed from frontend)",
                    "coExtSdk.js : opts.failUrl",
                    "FO 결제 위젯에서 직접 전달 — 서버 설정 불필요"},
            });
            logTable("Payment - KakaoPay", new String[][]{
                {"CID",        kakaoPayCid.isBlank() ? nc : maskSecret(kakaoPayCid),
                    "sy_prop : app.pay.kakaopay.cid",
                    kakaoPayCid.isBlank() ? "카카오페이 개발자 → 내 애플리케이션 → CID 발급 후 입력" : ""},
                {"Secret Key", "(runtime only)",
                    "sy_prop : app.pay.kakaopay.secret-key",
                    "미설정 시 결제 승인 실패 — 카카오페이 어드민에서 Admin Key 발급"},
            });
            logTable("Payment - NaverPay", new String[][]{
                {"Client ID",  naverPayId.isBlank() ? nc : maskSecret(naverPayId),
                    "sy_prop : app.pay.naverpay.client-id",
                    naverPayId.isBlank() ? "네이버페이 파트너센터에서 Client ID 발급 후 입력" : ""},
                {"Secret Key", "(runtime only)",
                    "sy_prop : app.pay.naverpay.client-secret",
                    "미설정 시 결제 승인 실패 — 네이버페이 파트너센터에서 Client Secret 발급"},
                {"API URL",    naverPayApiUrl.isBlank() ? "(default)" : naverPayApiUrl,
                    "sy_prop : app.pay.naverpay.api-url",
                    naverPayApiUrl.isBlank() ? "기본값: https://dev.apis.naver.com/naverpay-partner/naverpay (개발용)" : ""},
            });
        } catch (Exception e) {
            log.warn("[Payment] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [08] Map API #################################################### */

    private static void checkMapConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String kakaoMapKey = env.getProperty("app.map.kakao-js-key",         "");
            String naverMapId  = env.getProperty("app.map.naver-map-client-id",  "");
            String googleMapKey= env.getProperty("app.map.google-api-key",       "");
            String nc = "(not configured)";

            logTable("Map API - Kakao", new String[][]{
                {"JS Key", kakaoMapKey.isBlank() ? nc : maskSecret(kakaoMapKey),
                    "sy_prop ^local^dev^ : app.map.kakao-js-key",
                    kakaoMapKey.isBlank() ? "Kakao Developers → 내 애플리케이션 → 앱 키 → JavaScript 키 입력" : ""},
            });
            logTable("Map API - Naver", new String[][]{
                {"Client ID", naverMapId.isBlank() ? nc : maskSecret(naverMapId),
                    "sy_prop ^local^dev^ : app.map.naver-map-client-id",
                    naverMapId.isBlank() ? "Naver Cloud → Application → Client ID 발급 후 입력" : ""},
            });
            logTable("Map API - Google", new String[][]{
                {"API Key", googleMapKey.isBlank() ? nc : maskSecret(googleMapKey),
                    "sy_prop ^local^dev^ : app.map.google-api-key",
                    googleMapKey.isBlank() ? "Google Cloud Console → Maps API 키 발급 후 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[Map API] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [09] SMTP Mail #################################################### */

    private static void checkMailConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String host   = env.getProperty("spring.mail.host",     "");
            String port   = env.getProperty("spring.mail.port",     "");
            String user   = env.getProperty("spring.mail.username", "");
            String pass   = env.getProperty("spring.mail.password", "");
            String from   = env.getProperty("app.mail.from",        "");
            String fromNm = env.getProperty("app.mail.from-nm",     "");
            String nc = "(not configured)";
            logTable("SMTP Mail", new String[][]{
                {"Host",     host.isBlank()   ? nc : host,
                    "application-{profile}.yml : spring.mail.host",
                    host.isBlank()   ? "SMTP 호스트 미설정 — Gmail이면 smtp.gmail.com 입력" : ""},
                {"Port",     port.isBlank()   ? nc : port,
                    "application-{profile}.yml : spring.mail.port",
                    port.isBlank()   ? "SMTP 포트 미설정 — TLS이면 587, SSL이면 465 입력" : ""},
                {"Username", user.isBlank()   ? nc : user,
                    "application-{profile}.yml : spring.mail.username",
                    user.isBlank()   ? "SMTP 계정 미설정 — 발신용 이메일 주소 입력" : ""},
                {"Password", pass.isBlank()   ? nc : maskMiddle(pass),
                    "application-{profile}.yml : spring.mail.password",
                    pass.isBlank()   ? "SMTP 비밀번호 미설정 — Gmail이면 앱 비밀번호 생성 후 입력" : ""},
                {"From",     (fromNm.isBlank() ? nc : fromNm) + " <" + (from.isBlank() ? nc : from) + ">",
                    "application-{profile}.yml : app.mail.from / app.mail.from-nm",
                    (from.isBlank() || fromNm.isBlank()) ? "발신자명/이메일 미설정 — yml에 app.mail.from 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[SMTP Mail] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [10] SMS #################################################### */

    private static void checkSmsConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String enabled   = env.getProperty("app.sms.enabled",    "false");
            String provider  = env.getProperty("app.sms.provider",   "");
            String apiKey    = env.getProperty("app.sms.api-key",    "");
            String apiSecret = env.getProperty("app.sms.api-secret", "");
            String from      = env.getProperty("app.sms.from",       "");
            String nc = "(not configured)";
            logTable("SMS", new String[][]{
                {"Enabled",    enabled,
                    "application-{profile}.yml : app.sms.enabled",
                    "false=SMS delivery disabled"},
                {"Provider",   provider.isBlank()  ? nc : provider,
                    "sy_prop : app.sms.provider (aligo/coolsms/ncp/twilio)",
                    provider.isBlank()  ? "sy_prop에 app.sms.provider 값 설정 (aligo/coolsms/ncp)" : ""},
                {"API Key",    apiKey.isBlank()    ? nc : maskSecret(apiKey),
                    "sy_prop ^local^dev^ : app.sms.api-key",
                    apiKey.isBlank()    ? "SMS 공급사 콘솔에서 API Key 발급 후 sy_prop에 입력" : ""},
                {"API Secret", apiSecret.isBlank() ? nc : "***",
                    "sy_prop ^local^dev^ : app.sms.api-secret",
                    apiSecret.isBlank() ? "SMS 공급사 콘솔에서 API Secret 발급 후 sy_prop에 입력" : ""},
                {"From",       from.isBlank()      ? nc : from,
                    "sy_prop : app.sms.from",
                    from.isBlank()      ? "발신번호 미등록 — 통신사 사전 등록 번호 입력 필요" : ""},
            });
        } catch (Exception e) {
            log.warn("[SMS] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [11] Push #################################################### */

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
            logTable("Push - FCM (Android)", new String[][]{
                {"Enabled",    fcmEnabled,
                    "application-{profile}.yml : app.push.fcm.enabled",
                    "false=Android push disabled"},
                {"Project ID", fcmProjectId.isBlank() ? nc : fcmProjectId,
                    "sy_prop ^local^dev^ : app.push.fcm.project-id",
                    fcmProjectId.isBlank() ? "Firebase 콘솔 → 프로젝트 설정에서 프로젝트 ID 확인 후 입력" : ""},
                {"Key File",   fcmKeyFile.isBlank()   ? nc : fcmKeyFile,
                    "sy_prop : app.push.fcm.key-file (service account JSON path)",
                    fcmKeyFile.isBlank()   ? "Firebase 콘솔 → 서비스 계정 → JSON 키 다운로드 후 경로 입력" : ""},
            });
            logTable("Push - APNs (iOS)", new String[][]{
                {"Enabled",   apnsEnabled,
                    "application-{profile}.yml : app.push.apns.enabled",
                    "false=iOS push disabled"},
                {"Key ID",    apnsKeyId.isBlank()    ? nc : apnsKeyId,
                    "sy_prop ^local^dev^ : app.push.apns.key-id",
                    apnsKeyId.isBlank()    ? "Apple Developer → Keys에서 APNs Key 생성 후 Key ID 입력" : ""},
                {"Team ID",   apnsTeamId.isBlank()   ? nc : apnsTeamId,
                    "sy_prop ^local^dev^ : app.push.apns.team-id",
                    apnsTeamId.isBlank()   ? "Apple Developer → 계정 → Membership에서 Team ID 확인" : ""},
                {"Key File",  apnsKeyFile.isBlank()  ? nc : apnsKeyFile,
                    "sy_prop : app.push.apns.key-file (.p8 path)",
                    apnsKeyFile.isBlank()  ? "Apple Developer에서 .p8 키 다운로드 후 서버 경로 입력" : ""},
                {"Bundle ID", apnsBundleId.isBlank() ? nc : apnsBundleId,
                    "sy_prop : app.push.apns.bundle-id",
                    apnsBundleId.isBlank() ? "Xcode → 프로젝트 설정에서 Bundle ID 확인 후 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[Push] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [12] Chat #################################################### */

    private static void checkChatConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String wsEnabled   = env.getProperty("app.chat.ws.enabled",         "false");
            String wsEndpoint  = env.getProperty("app.chat.ws.endpoint",        "");
            String wsOrigins   = env.getProperty("app.chat.ws.allowed-origins", "");
            String kakaoEnabled= env.getProperty("app.chat.kakao.enabled",      "false");
            String kakaoChKey  = env.getProperty("app.chat.kakao.channel-key",  "");
            String nc = "(not configured)";
            logTable("Chat - WebSocket", new String[][]{
                {"Enabled",         wsEnabled,
                    "application-{profile}.yml : app.chat.ws.enabled",
                    "false=FO realtime chat disabled"},
                {"Endpoint",        wsEndpoint.isBlank()  ? nc : wsEndpoint,
                    "sy_prop : app.chat.ws.endpoint",
                    wsEndpoint.isBlank()  ? "sy_prop에 app.chat.ws.endpoint 값 설정 (예: /ws)" : ""},
                {"Allowed Origins", wsOrigins.isBlank()   ? nc : wsOrigins,
                    "sy_prop : app.chat.ws.allowed-origins",
                    wsOrigins.isBlank()   ? "FO 접속 주소 입력 (예: http://127.0.0.1:5501)" : ""},
            });
            logTable("Chat - Kakao Channel", new String[][]{
                {"Enabled",     kakaoEnabled,
                    "application-{profile}.yml : app.chat.kakao.enabled",
                    "false=Kakao channel chat disabled"},
                {"Channel Key", kakaoChKey.isBlank() ? nc : maskSecret(kakaoChKey),
                    "sy_prop ^local^dev^ : app.chat.kakao.channel-key",
                    kakaoChKey.isBlank() ? "카카오 채널 관리자 → 채널 홈 URL에서 채널 키 확인 후 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[Chat] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [13] AI #################################################### */

    private static void checkAiConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String aiEnabled  = env.getProperty("app.chat.ai.enabled",   "false");
            String aiProvider = env.getProperty("app.chat.ai.provider",  "");
            String aiApiKey   = env.getProperty("app.chat.ai.api-key",   "");
            String aiModel    = env.getProperty("app.chat.ai.model",     "");
            String claudeKey  = env.getProperty("app.ai.claude.api-key", "");
            String openaiKey  = env.getProperty("app.ai.openai.api-key", "");
            String openaiMdl  = env.getProperty("app.ai.openai.model",   "");
            String claudeMdl  = env.getProperty("app.ai.claude.model",   "");
            String nc = "(not configured)";
            logTable("AI Chatbot (FO)", new String[][]{
                {"Enabled",  aiEnabled,
                    "application-{profile}.yml : app.chat.ai.enabled",
                    "false=FO AI chatbot disabled"},
                {"Provider", aiProvider.isBlank() ? nc : aiProvider,
                    "sy_prop : app.chat.ai.provider (openai/claude/gemini)",
                    aiProvider.isBlank() ? "sy_prop에 app.chat.ai.provider 값 설정 (openai/claude/gemini)" : ""},
                {"API Key",  aiApiKey.isBlank()   ? nc : maskMiddle(aiApiKey),
                    "sy_prop ^local^dev^ : app.chat.ai.api-key",
                    aiApiKey.isBlank()   ? "공급사 콘솔에서 API Key 발급 후 sy_prop에 입력" : ""},
                {"Model",    aiModel.isBlank()    ? nc : aiModel,
                    "sy_prop : app.chat.ai.model (gpt-4o / claude-sonnet-4-6)",
                    aiModel.isBlank()    ? "sy_prop에 app.chat.ai.model 값 설정 필요" : ""},
            });
            logTable("AI API Keys (BO ext)", new String[][]{
                {"Claude Key",    claudeKey.isBlank()  ? nc : maskMiddle(claudeKey),
                    "sy_prop ^local^dev^ : app.ai.claude.api-key",
                    claudeKey.isBlank()  ? "console.anthropic.com → API Keys에서 발급 후 sy_prop에 입력" : ""},
                {"Claude Model",  claudeMdl.isBlank()  ? nc : claudeMdl,
                    "sy_prop : app.ai.claude.model",
                    claudeMdl.isBlank()  ? "미설정 시 claude-sonnet-4-6 사용 (sy_prop에 명시 권장)" : ""},
                {"OpenAI Key",    openaiKey.isBlank()  ? nc : maskMiddle(openaiKey),
                    "sy_prop ^local^dev^ : app.ai.openai.api-key",
                    openaiKey.isBlank()  ? "platform.openai.com → API Keys에서 발급 후 sy_prop에 입력" : ""},
                {"OpenAI Model",  openaiMdl.isBlank()  ? nc : openaiMdl,
                    "sy_prop : app.ai.openai.model",
                    openaiMdl.isBlank()  ? "미설정 시 gpt-4o-mini 사용 (sy_prop에 명시 권장)" : ""},
            });
        } catch (Exception e) {
            log.warn("[AI] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [14] License #################################################### */

    private static void checkLicenseConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String licEnabled = env.getProperty("app.license.enabled", "true");
            String licSecret  = env.getProperty("app.license.secret",  "");
            String nc = "(not configured)";
            logTable("License", new String[][]{
                {"Enabled", licEnabled,
                    "sy_prop : app.license.enabled",
                    "false=license check skipped"},
                {"Secret",  licSecret.isBlank() ? nc : maskMiddle(licSecret),
                    "sy_prop ^local^dev^ : app.license.secret",
                    licSecret.isBlank() ? "라이선스 HMAC 검증 실패 — sy_prop에 app.license.secret 입력" : ""},
            });
        } catch (Exception e) {
            log.warn("[License] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [15] logTable renderer #################################################### */

    /**
     * 5-column table: key | value | source-type | env-tag | key-path [| note]
     * rows: { "key", "value", "source" }  or  { "key", "value", "source", "note" }
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
                note = "sy_prop 미등록 — BO > 시스템 > 프로퍼티 관리에서 등록";
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

    /* ##### [16] helpers #################################################### */

    /**
     * Parse source string into [type, env-tag, key-path].
     * Formats:  "type : key"  |  "type ^tag^ : key"  |  other
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

    private static String r(int w) { return "─".repeat(w + 2); }

    private static String nvl(String s) { return s != null ? s : ""; }

    private static String pad(String s, int width) {
        if (s == null) s = "";
        return s.length() >= width ? s : s + " ".repeat(width - s.length());
    }

    private static String maskMiddle(String val) {
        if (val == null || val.isBlank()) return "(not configured)";
        if (val.length() <= 6) return "***";
        int mid = val.length() / 2;
        return val.substring(0, mid - 1) + "***" + val.substring(mid + 2);
    }

    private static String maskSecret(String secret) {
        if (secret == null || secret.isEmpty()) return "(not configured)";
        if (secret.length() <= 4) return "****";
        return secret.substring(0, 4) + "****";
    }
}
