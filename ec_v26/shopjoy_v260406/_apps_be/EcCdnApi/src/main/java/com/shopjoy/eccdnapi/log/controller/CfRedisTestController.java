package com.shopjoy.eccdnapi.log.controller;

import com.shopjoy.eccdnapi.common.config.CfRedisProperties;
import com.shopjoy.eccdnapi.common.exception.CfBizException;
import com.shopjoy.eccdnapi.common.response.ApiResponse;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import redis.clients.jedis.Jedis;
import redis.clients.jedis.params.ScanParams;
import redis.clients.jedis.resps.ScanResult;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis 모니터링(연결 테스트) API — /api/cdn/redis/test (요청사항: "redis 모니터링 화면도
 * 추가해주고"). EcCdnApi 자체는 Redis 를 쓰지 않으므로(빈으로 미리 연결해둔 게 없음), 화면에서
 * 입력한 host/port/password/database 로 그때그때 1회성 접속해 PING·INFO 일부·키 샘플만 확인한다
 * (예: EcAdminApi 쪽 Redis 를 이 화면에서 원격으로 점검할 때도 그대로 사용 가능).
 */
@RestController
@RequestMapping("/api/cdn/redis")
@RequiredArgsConstructor
public class CfRedisTestController {

    private final CfRedisProperties cfRedisProperties;

    /** 이 앱(app.redis.*)에 실제로 설정된 접속정보(비밀번호 제외) — 화면에서 "현재 설정값으로
     *  채우기" 용도(요청사항: "redis switch 될수 있게 해줘" — 스위치 상태를 화면에서 바로 확인). */
    @GetMapping("/config-defaults")
    public ApiResponse<Map<String, Object>> configDefaults() {
        CfRedisProperties.Node node = cfRedisProperties.getPrimary();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("enabled", cfRedisProperties.isEnabled());
        m.put("host", node.getHost());
        m.put("port", node.getPort());
        m.put("database", node.getDatabase());
        return ApiResponse.ok(m);
    }

    @Getter
    @Setter
    public static class Req {
        private String host;
        private Integer port;
        private String password;
        private Integer database;
    }

    @PostMapping("/test")
    public ApiResponse<Map<String, Object>> test(@RequestBody Req req) {
        if (req.getHost() == null || req.getHost().isBlank()) throw new CfBizException("host 를 입력하세요.");
        int port = req.getPort() != null ? req.getPort() : 6379;

        try (Jedis jedis = new Jedis(req.getHost(), port, 5000)) {
            if (req.getPassword() != null && !req.getPassword().isBlank()) {
                jedis.auth(req.getPassword());
            }
            if (req.getDatabase() != null) {
                jedis.select(req.getDatabase());
            }
            String pong = jedis.ping();
            long dbSize = jedis.dbSize();
            Map<String, String> infoMap = parseInfo(jedis.info());

            // 키 샘플 20개 — KEYS * 는 대량 데이터에서 서버를 블로킹하므로 반드시 SCAN 사용.
            ScanResult<String> scan = jedis.scan("0", new ScanParams().count(20));
            List<String> sampleKeys = new ArrayList<>(scan.getResult());

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("ping", pong);
            result.put("dbSize", dbSize);
            result.put("redisVersion", infoMap.getOrDefault("redis_version", "-"));
            result.put("role", infoMap.getOrDefault("role", "-"));
            result.put("connectedClients", infoMap.getOrDefault("connected_clients", "-"));
            result.put("usedMemoryHuman", infoMap.getOrDefault("used_memory_human", "-"));
            result.put("uptimeInDays", infoMap.getOrDefault("uptime_in_days", "-"));
            result.put("osInfo", infoMap.getOrDefault("os", "-"));
            result.put("sampleKeys", sampleKeys);
            return ApiResponse.ok(result);
        } catch (Exception e) {
            throw new CfBizException("Redis 연결 실패: " + e.getMessage());
        }
    }

    /** Redis INFO 응답("key:value\r\n" 반복, "#"로 시작하는 섹션 헤더 포함)을 Map 으로 파싱. */
    private Map<String, String> parseInfo(String raw) {
        Map<String, String> map = new LinkedHashMap<>();
        if (raw == null) return map;
        for (String line : raw.split("\r\n")) {
            if (line.isBlank() || line.startsWith("#")) continue;
            int idx = line.indexOf(':');
            if (idx > 0) map.put(line.substring(0, idx), line.substring(idx + 1));
        }
        return map;
    }
}
