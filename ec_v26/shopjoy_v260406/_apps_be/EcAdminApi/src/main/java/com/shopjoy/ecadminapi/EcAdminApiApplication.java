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

        long elapsedMs = System.currentTimeMillis() - startedAt;
        log.info("⏱  [구동 소요 시간] {}.{}초 ({} ms)", elapsedMs / 1000, String.format("%03d", elapsedMs % 1000), elapsedMs);
    }

    /** checkDatabaseConnection — 검증 */
    private static void checkDatabaseConnection(ConfigurableApplicationContext ctx) {
        try {
            DataSource dataSource = ctx.getBean(DataSource.class);
            try (Connection conn = dataSource.getConnection()) {
                if (conn != null && !conn.isClosed()) {
                    String dbUrl = conn.getMetaData().getURL();
                    String dbDriver = conn.getMetaData().getDriverName();
                    String dbName = extractDatabaseName(dbUrl);
                    String username = conn.getMetaData().getUserName();

                    log.info("✅ [DB 연결 성공]");
                    log.info("   - Driver: {}", dbDriver);
                    log.info("   - URL: {}", dbUrl);
                    log.info("   - Database: {}", dbName);
                    log.info("   - Username: {}", username);
                    log.info("   - Status: Connected");
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
                log.info("✅ [Redis 연결 성공]");

                try {
                    String version = "unknown";
                    try {
                        Object info = primaryTemplate.execute((RedisCallback<Object>) connection ->
                            connection.info("server")
                        );

                        if (info != null) {
                            String infoStr = info.toString();
                            String[] lines = infoStr.split("\\r?\\n");

                            for (String line : lines) {
                                if (line.contains("redis_version:")) {
                                    version = line.split(":")[1].trim();
                                    break;
                                }
                            }
                        }
                    } catch (Exception ex) {
                        // Version retrieval failed, continue with default
                    }

                    String host = lettuceFactory.getStandaloneConfiguration().getHostName();
                    int port = lettuceFactory.getStandaloneConfiguration().getPort();
                    int database = lettuceFactory.getStandaloneConfiguration().getDatabase();

                    log.info("   - Host: {}", host);
                    log.info("   - Port: {}", port);
                    log.info("   - Database: {}", database);
                    log.info("   - Version: {}", version);
                    log.info("   - Status: Connected");
                } catch (Exception e) {
                    String host = lettuceFactory.getStandaloneConfiguration().getHostName();
                    int port = lettuceFactory.getStandaloneConfiguration().getPort();
                    int database = lettuceFactory.getStandaloneConfiguration().getDatabase();

                    log.info("   - Host: {}", host);
                    log.info("   - Port: {}", port);
                    log.info("   - Database: {}", database);
                    log.info("   - Status: Connected");
                }
            } else {
                log.error("❌ [Redis 연결 실패] Unexpected ping response: {}", ping);
            }
        } catch (Exception e) {
            try {
                boolean enabled = ctx.getEnvironment().getProperty("app.redis.enabled", Boolean.class, false);
                if (!enabled) {
                    log.info("⊘ [Redis] 비활성화 상태 (app.redis.enabled=false)");
                } else {
                    log.error("❌ [Redis 연결 실패] {}", e.getMessage());
                }
            } catch (Exception ex) {
                log.info("⊘ [Redis] 비활성화 상태 (Bean이 생성되지 않음)");
            }
        }
    }

    /** checkFileStorageConfiguration — 검증 */
    private static void checkFileStorageConfiguration(ConfigurableApplicationContext ctx) {
        try {
            String storageType = ctx.getEnvironment().getProperty("app.file.storage-type", "LOCAL");

            log.info("📁 [파일 스토리지 설정]");
            log.info("   - Storage Type: {}", storageType);

            switch (storageType.toUpperCase()) {
                case "LOCAL":
                    String basePath = ctx.getEnvironment().getProperty("app.file.local.base-path", "static/cdn");
                    String uploadDir = ctx.getEnvironment().getProperty("app.file.local.upload-dir", "uploads");
                    log.info("   - Base Path: {}", basePath);
                    log.info("   - Upload Dir: {}", uploadDir);
                    log.info("   - Status: Local Storage Active");
                    break;

                case "AWS_S3":
                    String awsBucket = ctx.getEnvironment().getProperty("app.file.aws.bucket-name", "");
                    String awsRegion = ctx.getEnvironment().getProperty("app.file.aws.region", "ap-northeast-2");
                    String awsCdnUrl = ctx.getEnvironment().getProperty("app.file.aws.cdn-url", "");
                    String awsAccessKey = ctx.getEnvironment().getProperty("app.file.aws.access-key", "");

                    log.info("   - Bucket: {}", awsBucket);
                    log.info("   - Region: {}", awsRegion);
                    log.info("   - CDN URL: {}", awsCdnUrl);
                    log.info("   - Access Key: {}", maskSecret(awsAccessKey));
                    log.info("   - Status: AWS S3 Active");
                    break;

                case "NCP_OBS":
                    String ncpBucket = ctx.getEnvironment().getProperty("app.file.ncp.bucket-name", "");
                    String ncpEndpoint = ctx.getEnvironment().getProperty("app.file.ncp.endpoint", "");
                    String ncpCdnUrl = ctx.getEnvironment().getProperty("app.file.ncp.cdn-url", "");
                    String ncpAccessKey = ctx.getEnvironment().getProperty("app.file.ncp.access-key", "");

                    log.info("   - Bucket: {}", ncpBucket);
                    log.info("   - Endpoint: {}", ncpEndpoint);
                    log.info("   - CDN URL: {}", ncpCdnUrl);
                    log.info("   - Access Key: {}", maskSecret(ncpAccessKey));
                    log.info("   - Status: NCP OBS Active");
                    break;

                default:
                    log.warn("   - Unknown Storage Type: {}", storageType);
            }

            String cdnHost = ctx.getEnvironment().getProperty("app.file.cdn-host", "");
            log.info("   - CDN Host: {}", cdnHost);
            log.info("   - Thumbnail Enabled: {}", ctx.getEnvironment().getProperty("app.file.thumbnail-enabled", "true"));

        } catch (Exception e) {
            log.warn("❌ [파일 스토리지] 설정 조회 실패 — {}", e.getMessage());
        }
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
