package com.shopjoy.ecadminapi.cache.controller;

import com.shopjoy.ecadminapi.cache.config.RedisProperties;
import com.shopjoy.ecadminapi.cache.service.CacheRedisInfoService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Redis 캐시 조회 API (읽기 전용).
 * Base: /api/cache/redis
 *
 * ── 상태/정보 ──────────────────────────────────────────────────────
 * GET  /api/cache/redis/status              캐시 활성 여부 + 도메인별 지원 방식
 * GET  /api/cache/redis/info                도메인별 캐시 상태 (키 존재, 갱신 시각, 남은 TTL, 키 수)
 * GET  /api/cache/redis/config              Redis + 애플리케이션 환경 설정값 (비밀번호 마스킹)
 *
 * ── 캐시값 조회 ───────────────────────────────────────────────────
 * GET  /api/cache/redis/data/{domains}      도메인 전체 캐시값 (^ 멀티 지원)
 * GET  /api/cache/redis/data/{domain}/{key} 서브키 단건 캐시값
 *   예) /data/sy-code/ORDER_STATUS          → 주문상태 코드 그룹
 *       /data/sy-role-menu/ROLE001          → 역할별 메뉴 ID 목록
 *       /data/ec-pd-prod/P2604001           → 상품 상세
 *       /data/sy-i18n/ko:btn.save           → 다국어 메시지 단건
 *
 * ── 공통 ──────────────────────────────────────────────────────────
 * Redis 비활성(app.redis.enabled=false) 시 모든 엔드포인트는 메시지만 반환
 * 멀티 도메인: ^ 구분자 사용  예) sy-code^sy-menu^sy-role
 */
@RestController
@RequestMapping("/api/cache/redis")
@RequiredArgsConstructor
public class CacheRedisInfoController {

    private static final String MSG_DISABLED = "Redis가 비활성화 상태입니다. (app.redis.enabled=false)";

    private final CacheRedisInfoService cacheRedisInfoService;
    private final RedisProperties       redisProps;
    private final Environment           env;

    /** 캐시 활성 여부 + 도메인별 지원 방식 */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        if (!cacheRedisInfoService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Map<String, Object> result = cacheRedisInfoService.getStatus();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 도메인별 캐시 상태 (키 존재, 갱신 시각, 남은 TTL, 키 수) */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> info() {
        if (!cacheRedisInfoService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        List<Map<String, Object>> result = cacheRedisInfoService.getInfo();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * Redis + 애플리케이션 환경 설정값 조회.
     * 비밀번호는 마스킹 처리. primary/secondary 노드 정보, TTL 설정, active profiles 포함.
     */
    @GetMapping("/config")
    public ResponseEntity<ApiResponse<Map<String, Object>>> config() {
        if (!cacheRedisInfoService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));

        Map<String, Object> result = new LinkedHashMap<>();

        // ── 애플리케이션 정보 ────────────────────────────────────────
        Map<String, Object> app = new LinkedHashMap<>();
        app.put("activeProfiles", Arrays.asList(env.getActiveProfiles()));
        app.put("applicationName", env.getProperty("spring.application.name", "-"));
        result.put("app", app);

        // ── Redis 기본 설정 ──────────────────────────────────────────
        result.put("enabled",      redisProps.isEnabled());
        result.put("hasSecondary", redisProps.hasSecondary());

        // ── primary 노드 ─────────────────────────────────────────────
        RedisProperties.Node pri = redisProps.getPrimary();
        Map<String, Object> primary = new LinkedHashMap<>();
        primary.put("host",     pri.getHost());
        primary.put("port",     pri.getPort());
        primary.put("database", pri.getDatabase());
        primary.put("timeout",  pri.getTimeout());
        primary.put("password", maskPassword(pri.getPassword()));
        result.put("primary", primary);

        // ── secondary 노드 ───────────────────────────────────────────
        if (redisProps.hasSecondary()) {
            RedisProperties.Node sec = redisProps.getSecondary();
            Map<String, Object> secondary = new LinkedHashMap<>();
            secondary.put("host",     sec.getHost());
            secondary.put("port",     sec.getPort());
            secondary.put("database", sec.getDatabase());
            secondary.put("timeout",  sec.getTimeout());
            secondary.put("password", maskPassword(sec.getPassword()));
            result.put("secondary", secondary);
        } else {
            result.put("secondary", "미설정 (primary fallback)");
        }

        // ── TTL 설정 ─────────────────────────────────────────────────
        RedisProperties.Ttl ttl = redisProps.getTtl();
        Map<String, Object> ttlMap = new LinkedHashMap<>();
        ttlMap.put("bo-auth",          ttl.getBoAuthSeconds());
        ttlMap.put("fo-auth",          ttl.getFoAuthSeconds());
        ttlMap.put("ext-auth",         ttl.getExtAuthSeconds());
        ttlMap.put("sy-code",          ttl.getSyCodeSeconds());
        ttlMap.put("sy-menu",          ttl.getSyMenuSeconds());
        ttlMap.put("sy-role",          ttl.getSyRoleSeconds());
        ttlMap.put("sy-role-menu",     ttl.getSyRoleMenuSeconds());
        ttlMap.put("sy-prop",          ttl.getSyPropSeconds());
        ttlMap.put("sy-i18n",          ttl.getSyI18nSeconds());
        ttlMap.put("ec-pd-prod",       ttl.getEcPdProdSeconds());
        ttlMap.put("ec-pd-cate",       ttl.getEcPdCateSeconds());
        ttlMap.put("ec-pd-cate-prod",  ttl.getEcPdCateProdSeconds());
        ttlMap.put("ec-pm-prom",       ttl.getEcPmPromSeconds());
        ttlMap.put("ec-pm-prom-item",  ttl.getEcPmPromItemSeconds());
        ttlMap.put("ec-dp-disp",       ttl.getEcDpDispSeconds());
        ttlMap.put("ec-dp-disp-item",  ttl.getEcDpDispItemSeconds());
        result.put("ttl", ttlMap);

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 비밀번호 마스킹: 값이 있으면 "****", 없으면 빈 문자열 */
    private String maskPassword(String pw) {
        return (pw != null && !pw.isBlank()) ? "****" : "";
    }

    /**
     * 도메인 전체 캐시값 조회.
     * ^ 구분자로 멀티 지정 시 Map<domain, value> 형태로 반환.
     * 예) /data/sy-code^sy-prop
     */
    @GetMapping("/data/{domains}")
    public ResponseEntity<ApiResponse<Object>> getCacheAll(@PathVariable("domains") String domains) {
        if (!cacheRedisInfoService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));

        String[] parts = domains.split("\\^");
        if (parts.length == 1) {
            Object result = cacheRedisInfoService.getCacheAll(domains.trim());
            if (result == null)
                return ResponseEntity.ok(ApiResponse.ok(null,
                    domains + ": 캐시 없음 또는 서브키가 필요한 도메인입니다."));
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        for (String d : parts) {
            result.put(d.trim(), cacheRedisInfoService.getCacheAll(d.trim()));
        }
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 서브키 단건 캐시값 조회.
     * key 형식은 도메인별 상이:
     *   sy-code/{grp}            → 그룹 코드 목록
     *   sy-menu/{roleId}         → 역할별 메뉴
     *   sy-role/{roleId}         → 역할 상세
     *   sy-role-menu/{roleId}    → 허용 menuId 목록
     *   sy-prop/{propKey}        → 프로퍼티 값
     *   sy-i18n/{langCd}:{key}   → 다국어 메시지 단건
     *   ec-pd-prod/{prodId}      → 상품 상세
     *   ec-pd-cate/{cateId}      → 카테고리 상세
     *   ec-pd-cate-prod/{cateId} → 카테고리 상품 목록
     *   ec-pm-prom/{promId}      → 프로모션 상세
     *   ec-pm-prom-item/{promId} → 프로모션 항목 목록
     *   ec-dp-disp/{dispId}      → 전시 상세
     *   ec-dp-disp-item/{dispId} → 전시 항목 목록
     */
    @GetMapping("/data/{domain}/{key}")
    public ResponseEntity<ApiResponse<Object>> getCacheByKey(
            @PathVariable("domain") String domain,
            @PathVariable("key") String key) {
        if (!cacheRedisInfoService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Object result = cacheRedisInfoService.getCacheByKey(domain, key);
        if (result == null)
            return ResponseEntity.ok(ApiResponse.ok(null, domain + "/" + key + ": 캐시 없음"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
