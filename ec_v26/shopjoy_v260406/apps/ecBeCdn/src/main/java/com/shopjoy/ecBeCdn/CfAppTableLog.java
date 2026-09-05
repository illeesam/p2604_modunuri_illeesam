package com.shopjoy.ecBeCdn;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;

import javax.sql.DataSource;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * EcBeCdn 부팅 완료 시 환경정보/헬스체크를 콘솔에 표 형태로 찍어준다.
 * EcBeBo 의 AppTableLog.java(요청사항: "각종 환경정보 및 정상체크정보 db 간단한 select 도
 * 표시해주면 좋겠어")를 그대로 참고해 이식했다 — 이 앱 규모에 맞춰 DB/Redis/저장소/JWT
 * 4개 섹션만 유지한다(Payment/Social/SMS/Push/Chat/AI 등은 이 앱과 무관해 생략).
 *
 * <p>DB 섹션은 단순 연결 성공 여부(getConnection() 성공/실패)뿐 아니라, 요청사항대로 실제
 * {@code SELECT version()} 을 한 번 실행해 그 결과값까지 표에 보여준다 — "연결은 됐는데
 * 쿼리는 안 되는" 권한/스키마 문제까지 부팅 시점에 바로 드러내기 위함.
 */
@Slf4j
public class CfAppTableLog {

    private static String ACTIVE_PROFILE = "default";

    public static void run(ConfigurableApplicationContext ctx) {
        ACTIVE_PROFILE = String.join(", ", ctx.getEnvironment().getActiveProfiles());
        if (ACTIVE_PROFILE.isBlank()) ACTIVE_PROFILE = "default";

        checkDatabaseConnection(ctx);
        checkRedisConnection(ctx);
        checkStorageConfiguration(ctx);
        checkJwtConfiguration(ctx);
    }

    /* ##### [01] DB — 연결 + 간단한 SELECT #################################################### */

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

                // 요청사항: "db 간단한 select 도 표시해주면 좋겠어" — SELECT version() 실행 결과.
                String selectResult = simpleSelect(conn, "SELECT version()");
                // 요청사항: "cf_client/cf_file 건수말고 sy_code 의 데이타 2개행 정보를
                // 출력해주면 좋겠어" — EcBeCdn 은 cf_client/cf_file 전용 스키마지만, 같은
                // Postgres 서버·같은 shopjoy_2604 스키마를 EcBeBo 와 공유하므로 sy_code 도
                // 그대로 조회된다 — "이 커넥션이 EcBeBo 쪽 공통 테이블까지 정상 읽히는 진짜
                // 같은 DB냐"를 부팅 시점에 확인하는 용도.
                String[] syCodeRows = sampleRows(conn,
                    "SELECT code_id, code_grp_id, code_value, code_label FROM sy_code ORDER BY code_id LIMIT 2", 2);

                logTable("DB Connection", new String[][]{
                    {"Driver",             dbDriver,       ""},
                    {"URL",                dbUrl,          ""},
                    {"Database",           dbName,         ""},
                    {"Username",           username,       ""},
                    {"SELECT version()",   selectResult,   ""},
                    {"sy_code 행1",         syCodeRows[0],  ""},
                    {"sy_code 행2",         syCodeRows[1],  ""},
                    {"Status",             "Connected",    ""},
                });
            }
        } catch (Exception e) {
            log.error("[DB] Connection failed — {}", e.getMessage(), e);
        }
    }

    /** 단일 스칼라값 SELECT 실행 헬퍼 — 실패해도 예외를 던지지 않고 사유를 문자열로 담아 반환한다. */
    private static String simpleSelect(Connection conn, String sql) {
        try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            return rs.next() ? rs.getString(1) : "(no rows)";
        } catch (Exception e) {
            return "SELECT 실패 — " + e.getMessage();
        }
    }

    /**
     * 여러 컬럼을 가진 행 n개를 "col1=값 · col2=값 · ..." 형태 문자열 배열로 반환한다
     * (요청사항: "sy_code 의 데이타 2개행 정보를 출력해주면 좋겠어"). 결과가 n개보다 적으면
     * 나머지는 "(no rows)"로 채우고, 쿼리 자체가 실패하면 n개 전부에 사유를 담아 반환한다
     * — 어느 경우든 배열 길이는 항상 n으로 고정(호출부가 인덱스로 바로 꺼내 쓸 수 있게).
     */
    private static String[] sampleRows(Connection conn, String sql, int n) {
        String[] out = new String[n];
        try (Statement st = conn.createStatement(); ResultSet rs = st.executeQuery(sql)) {
            int colCount = rs.getMetaData().getColumnCount();
            int i = 0;
            while (i < n && rs.next()) {
                StringBuilder sb = new StringBuilder();
                for (int c = 1; c <= colCount; c++) {
                    if (c > 1) sb.append(" · ");
                    sb.append(rs.getMetaData().getColumnLabel(c)).append('=').append(rs.getString(c));
                }
                out[i++] = sb.toString();
            }
            while (i < n) out[i++] = "(no rows)";
        } catch (Exception e) {
            String msg = "SELECT 실패 — " + e.getMessage();
            java.util.Arrays.fill(out, msg);
        }
        return out;
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
                ctx.getBean("redisTemplate", RedisTemplate.class);
            LettuceConnectionFactory factory = (LettuceConnectionFactory) tpl.getConnectionFactory();
            if (factory == null) { log.error("[Redis] ConnectionFactory is null"); return; }
            String ping = factory.getConnection().ping();
            if (!"PONG".equals(ping)) {
                log.error("[Redis] Unexpected ping response: {}", ping);
                return;
            }
            String host     = factory.getStandaloneConfiguration().getHostName();
            int    port     = factory.getStandaloneConfiguration().getPort();
            int    database = factory.getStandaloneConfiguration().getDatabase();
            logTable("Redis Connection", new String[][]{
                {"Host",     host,                     ""},
                {"Port",     String.valueOf(port),     ""},
                {"Database", String.valueOf(database), ""},
                {"Ping",     ping,                     ""},
                {"Status",   "Connected",              ""},
            });
        } catch (Exception e) {
            boolean enabled = ctx.getEnvironment().getProperty("app.redis.enabled", Boolean.class, false);
            if (!enabled) log.info("[Redis] Disabled (app.redis.enabled=false)");
            else          log.error("[Redis] Connection failed — {}", e.getMessage());
        }
    }

    /* ##### [03] 파일 저장소 #################################################### */

    private static void checkStorageConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String storageRoot  = env.getProperty("app.cf.storage-root", "./storage");
            String maxFileSize  = env.getProperty("app.cf.max-file-size-mb", "120");
            String ffmpegPath   = env.getProperty("app.cf.ffmpeg-path", "ffmpeg");

            Path resolved = Paths.get(storageRoot).toAbsolutePath().normalize();
            boolean exists = new File(resolved.toString()).isDirectory();

            logTable("File Storage", new String[][]{
                {"Storage Root",   storageRoot,
                    "application-{profile}.yml : app.cf.storage-root", ""},
                {"Resolved Path",  resolved.toString(),
                    "", exists ? "" : "디렉터리가 아직 없음 — 최초 업로드 시 자동 생성됨"},
                {"Max File Size",  maxFileSize + "MB",
                    "application.yml : app.cf.max-file-size-mb", ""},
                {"ffmpeg Path",    ffmpegPath,
                    "application.yml : app.cf.ffmpeg-path (CF_FFMPEG_PATH)", ""},
                {"Status",         exists ? "Directory Exists" : "Will Create On First Upload", "", ""},
            });
        } catch (Exception e) {
            log.warn("[File Storage] Config check failed — {}", e.getMessage());
        }
    }

    /* ##### [04] JWT #################################################### */

    private static void checkJwtConfiguration(ConfigurableApplicationContext ctx) {
        try {
            org.springframework.core.env.Environment env = ctx.getEnvironment();
            String secret        = env.getProperty("app.cf.jwt.secret", "");
            String accessExpiry  = env.getProperty("app.cf.jwt.access-expiry-ms", "");
            String refreshExpiry = env.getProperty("app.cf.jwt.refresh-expiry-ms", "");
            String nc = "(not configured)";
            logTable("JWT (cf_client 인증)", new String[][]{
                {"Secret",         secret.isBlank() ? nc : maskMiddle(secret),
                    "application-{profile}.yml : app.cf.jwt.secret (CF_JWT_SECRET)",
                    secret.isBlank() ? "prod 는 기본값 없음 — 안 넘기면 부팅 자체가 실패함" : ""},
                {"Access Expiry",  fmtMs(accessExpiry),
                    "application.yml : app.cf.jwt.access-expiry-ms", ""},
                {"Refresh Expiry", fmtMs(refreshExpiry),
                    "application.yml : app.cf.jwt.refresh-expiry-ms", ""},
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

    /* ##### [05] logTable renderer (EcBeBo AppTableLog 와 동일 포맷) #################################################### */

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

    /* ##### [06] helpers #################################################### */

    private static String[] parseSrc(String raw) {
        if (raw == null || raw.isBlank()) return new String[]{"", "", ""};
        raw = raw.replace("{profile}", ACTIVE_PROFILE);

        int sep = raw.indexOf(" : ");
        if (sep < 0) return new String[]{"", "", raw.trim()};

        String left = raw.substring(0, sep).trim();
        String key  = raw.substring(sep + 3).trim();

        if (left.endsWith(".yml")) {
            String tag = "";
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("application-([^.]+)\\.yml").matcher(left);
            if (m.find()) tag = m.group(1);
            return new String[]{left, tag, key};
        }
        return new String[]{left, "", key};
    }

    private static String r(int w) { return "─".repeat(w + 2); }

    private static String pad(String s, int width) {
        if (s == null) s = "";
        return s.length() >= width ? s : s + " ".repeat(width - s.length());
    }

    private static String nvl(String s) { return s == null ? "" : s; }

    /**
     * 2026-09-06 보안수정 — 기존 로직은 "가운데 3글자만" 가려서, 60자 넘는 JWT 시크릿 같은
     * 긴 값은 앞뒤 대부분이 그대로 로그(+ 배포 이메일 첨부 로그파일)에 찍혔다(실측 확인:
     * cf.jwt.secret 60여 자 중 단 3자만 마스킹됨). 길이와 무관하게 앞/뒤 4자만 보이고
     * 나머지는 고정 폭 "..."으로 가린다 — 값의 실제 길이도 추측 못 하게.
     */
    private static String maskMiddle(String val) {
        if (val == null || val.isBlank()) return "(not configured)";
        if (val.length() <= 10) return "***";
        return val.substring(0, 4) + "..." + val.substring(val.length() - 4);
    }
}
