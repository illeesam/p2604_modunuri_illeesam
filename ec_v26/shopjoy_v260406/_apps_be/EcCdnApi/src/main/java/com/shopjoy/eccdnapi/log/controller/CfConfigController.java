package com.shopjoy.eccdnapi.log.controller;

import com.shopjoy.eccdnapi.common.response.ApiResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * application.yml 설정정보 조회 API — /api/cdn/config/info (요청사항: "application.yml 의
 * 설정정보 보는 화면도 추가해줘"). /api/cdn/** 전체가 permitAll(인증불필요)이므로, 여기서 절대
 * 시크릿(JWT 시크릿·DB 비밀번호)을 원문으로 내려주면 안 된다 — 값을 하나하나 화이트리스트로
 * 골라서 노출하고, 민감 항목은 REDACTED 로 마스킹한다(전체 Environment 덤프 금지).
 */
@RestController
@RequestMapping("/api/cdn/config")
public class CfConfigController {

    private static final String REDACTED = "•••REDACTED•••";

    @Value("${spring.profiles.active:local}")
    private String activeProfile;
    @Value("${server.port:3000}")
    private String serverPort;

    @Value("${app.cf.storage-root:./storage}")
    private String storageRoot;
    @Value("${app.cf.max-file-size-mb:120}")
    private String maxFileSizeMb;
    @Value("${app.cf.ffmpeg-path:ffmpeg}")
    private String ffmpegPath;
    @Value("${app.cf.jwt.access-expiry-ms:30000}")
    private String accessExpiryMs;
    @Value("${app.cf.jwt.refresh-expiry-ms:604800000}")
    private String refreshExpiryMs;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;
    @Value("${spring.datasource.username:}")
    private String datasourceUsername;
    @Value("${spring.datasource.driver-class-name:}")
    private String datasourceDriver;

    @Value("${logging.file.path:logs}")
    private String logDir;

    @Value("${app.redis.enabled:false}")
    private String redisEnabled;
    @Value("${app.redis.primary.host:}")
    private String redisHost;
    @Value("${app.redis.primary.port:6379}")
    private String redisPort;

    @GetMapping("/info")
    public ApiResponse<Map<String, Object>> info() {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("spring.profiles.active", activeProfile);
        m.put("server.port", serverPort);
        m.put("app.cf.storage-root", storageRoot);
        m.put("app.cf.max-file-size-mb", maxFileSizeMb);
        m.put("app.cf.ffmpeg-path", ffmpegPath);
        m.put("app.cf.jwt.access-expiry-ms", accessExpiryMs);
        m.put("app.cf.jwt.refresh-expiry-ms", refreshExpiryMs);
        m.put("app.cf.jwt.secret", REDACTED);
        m.put("spring.datasource.url", datasourceUrl);
        m.put("spring.datasource.username", datasourceUsername);
        m.put("spring.datasource.password", REDACTED);
        m.put("spring.datasource.driver-class-name", datasourceDriver);
        m.put("logging.file.path", logDir);
        m.put("app.redis.enabled", redisEnabled);
        m.put("app.redis.primary.host", redisHost.isBlank() ? "(미설정)" : redisHost);
        m.put("app.redis.primary.port", redisPort);
        m.put("java.version", System.getProperty("java.version"));
        m.put("os.name", System.getProperty("os.name"));
        m.put("user.dir", System.getProperty("user.dir"));
        return ApiResponse.ok(m);
    }
}
