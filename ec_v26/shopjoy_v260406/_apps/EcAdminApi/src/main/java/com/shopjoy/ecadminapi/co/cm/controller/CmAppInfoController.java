package com.shopjoy.ecadminapi.co.cm.controller;

import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringBootVersion;
import org.springframework.boot.info.BuildProperties;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.*;
import java.nio.file.FileStore;
import java.nio.file.FileSystems;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 애플리케이션 환경 정보 조회 API.
 *
 * GET /api/co/cm/app-info/info
 *   - 활성 프로파일, Java/JVM/OS/메모리 정보
 *   - application*.yml 주요 설정값 (비밀번호·시크릿 마스킹)
 *   - Spring Boot 버전, Gradle 빌드 정보 (build-info.properties 생성 시)
 *   - DB / JWT / Redis / 스케줄러 / 에러로그 / 액세스로그 설정
 *
 * ※ Gradle 빌드 정보를 포함하려면 build.gradle 에 다음 추가 필요:
 *    springBoot { buildInfo() }
 */
@RestController
@RequestMapping("/api/co/cm/app-info")
@RequiredArgsConstructor
public class CmAppInfoController {

    private final Environment      env;
    private final RedisProperties  redisProps;

    /** build-info.properties 가 있을 때만 주입 (springBoot { buildInfo() } 설정 시) */
    @Autowired(required = false)
    private BuildProperties buildProperties;

    // ── DB ──────────────────────────────────────────────────────────
    @Value("${spring.datasource.url:}")
    private String dbUrl;

    @Value("${spring.datasource.username:}")
    private String dbUsername;

    @Value("${spring.datasource.password:}")
    private String dbPassword;

    @Value("${spring.datasource.driver-class-name:}")
    private String dbDriverClassName;

    @Value("${spring.datasource.hikari.maximum-pool-size:10}")
    private int hikariMaxPoolSize;

    @Value("${spring.datasource.hikari.connection-timeout:30000}")
    private long hikariConnectionTimeout;

    // ── JPA ─────────────────────────────────────────────────────────
    @Value("${spring.jpa.hibernate.ddl-auto:none}")
    private String jpaHibernateDdlAuto;

    @Value("${spring.jpa.show-sql:false}")
    private boolean jpaShowSql;

    @Value("${spring.jpa.properties.hibernate.default_schema:}")
    private String hibernateSchema;

    // ── Server ───────────────────────────────────────────────────────
    @Value("${server.port:8080}")
    private String serverPort;

    @Value("${server.servlet.context-path:/}")
    private String contextPath;

    // ── JWT ──────────────────────────────────────────────────────────
    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${jwt.access-expiry:0}")
    private long jwtAccessExpiry;

    @Value("${jwt.refresh-expiry:0}")
    private long jwtRefreshExpiry;

    // ── Scheduler ────────────────────────────────────────────────────
    @Value("${app.scheduler.enabled:false}")
    private boolean schedulerEnabled;

    @Value("${app.scheduler.jenkins.enabled:false}")
    private boolean schedulerJenkinsEnabled;

    @Value("${app.scheduler.allowed-ips:*}")
    private String schedulerAllowedIps;

    // ── Error Log ────────────────────────────────────────────────────
    @Value("${app.error-log.db-save:false}")
    private boolean errorLogDbSave;

    @Value("${app.error-log.queue-size:100}")
    private int errorLogQueueSize;

    // ── Access Log ───────────────────────────────────────────────────
    @Value("${app.access-log.db-save:false}")
    private boolean accessLogDbSave;

    @Value("${app.access-log.queue-size:100}")
    private int accessLogQueueSize;

    @Value("${app.access-log.filter:*}")
    private String accessLogFilter;

    @Value("${app.access-log.max-body-size:0}")
    private int accessLogMaxBodySize;

    // ════════════════════════════════════════════════════════════════
    //  단일 엔드포인트
    // ════════════════════════════════════════════════════════════════

    @GetMapping("/info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> info() {
        Map<String, Object> result = new LinkedHashMap<>();

        result.put("app",       buildApp());
        result.put("build",     buildBuildInfo());
        result.put("java",      buildJava());
        result.put("os",        buildOs());
        result.put("resources", buildResources());
        result.put("server",    buildServer());
        result.put("db",        buildDb());
        result.put("jpa",       buildJpa());
        result.put("jwt",       buildJwt());
        result.put("redis",     buildRedis());
        result.put("scheduler", buildScheduler());
        result.put("errorLog",  buildErrorLog());
        result.put("accessLog", buildAccessLog());

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    // ════════════════════════════════════════════════════════════════
    //  섹션별 구성 메서드
    // ════════════════════════════════════════════════════════════════

    private Map<String, Object> buildApp() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name",           env.getProperty("spring.application.name", "EcAdminApi"));
        m.put("activeProfiles", Arrays.asList(env.getActiveProfiles()));
        m.put("defaultProfiles", Arrays.asList(env.getDefaultProfiles()));
        return m;
    }

    private Map<String, Object> buildBuildInfo() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("springBootVersion", SpringBootVersion.getVersion());
        if (buildProperties != null) {
            m.put("artifact",  buildProperties.getArtifact());
            m.put("group",     buildProperties.getGroup());
            m.put("version",   buildProperties.getVersion());
            m.put("buildTime", buildProperties.getTime() != null ? buildProperties.getTime().toString() : null);
        } else {
            m.put("gradleBuildInfo", "미생성 — build.gradle 에 springBoot { buildInfo() } 추가 후 재빌드 필요");
        }
        return m;
    }

    private Map<String, Object> buildJava() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("version",          System.getProperty("java.version"));
        m.put("vendor",           System.getProperty("java.vendor"));
        m.put("home",             System.getProperty("java.home"));
        m.put("vmName",           System.getProperty("java.vm.name"));
        m.put("vmVersion",        System.getProperty("java.vm.version"));
        m.put("runtimeVersion",   Runtime.version().toString());
        m.put("classVersion",     System.getProperty("java.class.version"));
        return m;
    }

    private Map<String, Object> buildOs() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("name",                System.getProperty("os.name"));
        m.put("version",             System.getProperty("os.version"));
        m.put("arch",                System.getProperty("os.arch"));
        m.put("availableProcessors", Runtime.getRuntime().availableProcessors());
        return m;
    }

    private Map<String, Object> buildResources() {
        Map<String, Object> m = new LinkedHashMap<>();
        long mb = 1024L * 1024L;
        long gb = 1024L * 1024L * 1024L;
        DateTimeFormatter dtFmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss")
                .withZone(ZoneId.systemDefault());

        // ── CPU ─────────────────────────────────────────────────────
        OperatingSystemMXBean osMx = ManagementFactory.getOperatingSystemMXBean();
        Map<String, Object> cpu = new LinkedHashMap<>();
        cpu.put("availableProcessors", osMx.getAvailableProcessors());
        cpu.put("systemLoadAverage",   round2(osMx.getSystemLoadAverage())); // -1=미지원
        if (osMx instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            cpu.put("systemCpuLoadPct",  round2(sunOs.getCpuLoad() * 100));
            cpu.put("processCpuLoadPct", round2(sunOs.getProcessCpuLoad() * 100));
            cpu.put("processCpuTimeMs",  sunOs.getProcessCpuTime() / 1_000_000L);
        }
        m.put("cpu", cpu);

        // ── 물리 메모리 (OS 전체) ────────────────────────────────────
        if (osMx instanceof com.sun.management.OperatingSystemMXBean sunOs) {
            Map<String, Object> physMem = new LinkedHashMap<>();
            physMem.put("totalMb",     sunOs.getTotalMemorySize()     / mb);
            physMem.put("freeMb",      sunOs.getFreeMemorySize()      / mb);
            physMem.put("usedMb",      (sunOs.getTotalMemorySize() - sunOs.getFreeMemorySize()) / mb);
            physMem.put("swapTotalMb", sunOs.getTotalSwapSpaceSize()  / mb);
            physMem.put("swapFreeMb",  sunOs.getFreeSwapSpaceSize()   / mb);
            m.put("physicalMemory", physMem);
        }

        // ── JVM 힙 / 논힙 ────────────────────────────────────────────
        MemoryMXBean memMx = ManagementFactory.getMemoryMXBean();
        MemoryUsage heap    = memMx.getHeapMemoryUsage();
        MemoryUsage nonHeap = memMx.getNonHeapMemoryUsage();
        Map<String, Object> jvmMem = new LinkedHashMap<>();
        jvmMem.put("heapUsedMb",      heap.getUsed()      / mb);
        jvmMem.put("heapCommittedMb", heap.getCommitted() / mb);
        jvmMem.put("heapMaxMb",       heap.getMax()       / mb);
        jvmMem.put("nonHeapUsedMb",   nonHeap.getUsed()   / mb);
        m.put("jvmMemory", jvmMem);

        // ── 스레드 ───────────────────────────────────────────────────
        ThreadMXBean threadMx = ManagementFactory.getThreadMXBean();
        Map<String, Object> threads = new LinkedHashMap<>();
        threads.put("liveCount",        threadMx.getThreadCount());
        threads.put("daemonCount",      threadMx.getDaemonThreadCount());
        threads.put("peakCount",        threadMx.getPeakThreadCount());
        threads.put("totalStarted",     threadMx.getTotalStartedThreadCount());
        m.put("threads", threads);

        // ── 프로세스 업타임 ──────────────────────────────────────────
        RuntimeMXBean rtMx = ManagementFactory.getRuntimeMXBean();
        long uptimeSec = rtMx.getUptime() / 1000;
        long startEpoch = rtMx.getStartTime() / 1000;
        Map<String, Object> uptime = new LinkedHashMap<>();
        uptime.put("startTime",   dtFmt.format(Instant.ofEpochSecond(startEpoch)));
        uptime.put("uptimeSec",   uptimeSec);
        uptime.put("uptimeHuman", String.format("%dd %dh %dm %ds",
            uptimeSec / 86400, (uptimeSec % 86400) / 3600,
            (uptimeSec % 3600) / 60, uptimeSec % 60));
        m.put("uptime", uptime);

        // ── GC ───────────────────────────────────────────────────────
        List<Map<String, Object>> gcList = new ArrayList<>();
        for (GarbageCollectorMXBean gc : ManagementFactory.getGarbageCollectorMXBeans()) {
            Map<String, Object> gcInfo = new LinkedHashMap<>();
            gcInfo.put("name",            gc.getName());
            gcInfo.put("collectionCount", gc.getCollectionCount());
            gcInfo.put("collectionTimeMs", gc.getCollectionTime());
            gcList.add(gcInfo);
        }
        m.put("gc", gcList);

        // ── 디스크 ───────────────────────────────────────────────────
        List<Map<String, Object>> diskList = new ArrayList<>();
        try {
            for (FileStore fs : FileSystems.getDefault().getFileStores()) {
                Map<String, Object> disk = new LinkedHashMap<>();
                disk.put("name",      fs.name());
                disk.put("type",      fs.type());
                disk.put("totalGb",   round2((double) fs.getTotalSpace()  / gb));
                disk.put("freeGb",    round2((double) fs.getUnallocatedSpace() / gb));
                disk.put("usableGb",  round2((double) fs.getUsableSpace() / gb));
                diskList.add(disk);
            }
        } catch (Exception ignored) {}
        m.put("disk", diskList);

        return m;
    }

    private Map<String, Object> buildServer() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("port",        serverPort);
        m.put("contextPath", contextPath);
        return m;
    }

    private Map<String, Object> buildDb() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("url",                  dbUrl);
        m.put("username",             dbUsername);
        m.put("password",             mask(dbPassword));
        m.put("driverClassName",      dbDriverClassName);
        m.put("hikariMaxPoolSize",    hikariMaxPoolSize);
        m.put("hikariConnectionTimeout", hikariConnectionTimeout);
        return m;
    }

    private Map<String, Object> buildJpa() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("hibernateDdlAuto",  jpaHibernateDdlAuto);
        m.put("showSql",           jpaShowSql);
        m.put("defaultSchema",     hibernateSchema);
        return m;
    }

    private Map<String, Object> buildJwt() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("secret",          mask(jwtSecret));
        m.put("accessExpiryMs",  jwtAccessExpiry);
        m.put("refreshExpiryMs", jwtRefreshExpiry);
        m.put("accessExpirySec", jwtAccessExpiry / 1000);
        m.put("refreshExpirySec", jwtRefreshExpiry / 1000);
        return m;
    }

    private Map<String, Object> buildRedis() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled",      redisProps.isEnabled());
        m.put("hasSecondary", redisProps.hasSecondary());

        RedisProperties.Node pri = redisProps.getPrimary();
        Map<String, Object> primary = new LinkedHashMap<>();
        primary.put("host",     pri.getHost());
        primary.put("port",     pri.getPort());
        primary.put("database", pri.getDatabase());
        primary.put("timeout",  pri.getTimeout());
        primary.put("password", mask(pri.getPassword()));
        m.put("primary", primary);

        if (redisProps.hasSecondary()) {
            RedisProperties.Node sec = redisProps.getSecondary();
            Map<String, Object> secondary = new LinkedHashMap<>();
            secondary.put("host",     sec.getHost());
            secondary.put("port",     sec.getPort());
            secondary.put("database", sec.getDatabase());
            secondary.put("timeout",  sec.getTimeout());
            secondary.put("password", mask(sec.getPassword()));
            m.put("secondary", secondary);
        } else {
            m.put("secondary", "미설정 (primary fallback)");
        }

        RedisProperties.Ttl ttl = redisProps.getTtl();
        Map<String, Object> ttlMap = new LinkedHashMap<>();
        ttlMap.put("bo-auth",         ttl.getBoAuthSeconds());
        ttlMap.put("fo-auth",         ttl.getFoAuthSeconds());
        ttlMap.put("ext-auth",        ttl.getExtAuthSeconds());
        ttlMap.put("sy-code",         ttl.getSyCodeSeconds());
        ttlMap.put("sy-menu",         ttl.getSyMenuSeconds());
        ttlMap.put("sy-role",         ttl.getSyRoleSeconds());
        ttlMap.put("sy-role-menu",    ttl.getSyRoleMenuSeconds());
        ttlMap.put("sy-prop",         ttl.getSyPropSeconds());
        ttlMap.put("sy-i18n",         ttl.getSyI18nSeconds());
        ttlMap.put("ec-pd-prod",      ttl.getEcPdProdSeconds());
        ttlMap.put("ec-pd-cate",      ttl.getEcPdCateSeconds());
        ttlMap.put("ec-pd-cate-prod", ttl.getEcPdCateProdSeconds());
        ttlMap.put("ec-pm-prom",      ttl.getEcPmPromSeconds());
        ttlMap.put("ec-pm-prom-item", ttl.getEcPmPromItemSeconds());
        ttlMap.put("ec-dp-disp",      ttl.getEcDpDispSeconds());
        ttlMap.put("ec-dp-disp-item", ttl.getEcDpDispItemSeconds());
        m.put("ttl", ttlMap);
        return m;
    }

    private Map<String, Object> buildScheduler() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled",        schedulerEnabled);
        m.put("jenkinsEnabled", schedulerJenkinsEnabled);
        m.put("allowedIps",     schedulerAllowedIps);
        return m;
    }

    private Map<String, Object> buildErrorLog() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dbSave",    errorLogDbSave);
        m.put("queueSize", errorLogQueueSize);
        return m;
    }

    private Map<String, Object> buildAccessLog() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("dbSave",      accessLogDbSave);
        m.put("queueSize",   accessLogQueueSize);
        m.put("filter",      accessLogFilter);
        m.put("maxBodySize", accessLogMaxBodySize);
        return m;
    }

    // ════════════════════════════════════════════════════════════════
    //  내부 유틸
    // ════════════════════════════════════════════════════════════════

    private String mask(String value) {
        return (value != null && !value.isBlank()) ? "****" : "";
    }

    private double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
