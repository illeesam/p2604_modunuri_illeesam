package com.shopjoy.ecadminapi.cache.controller;

import com.shopjoy.ecadminapi.cache.service.CacheRedisReloadService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Redis 캐시 갱신/삭제 API (쓰기).
 * Base: /api/cache/redis
 *
 * ── 재조회 (evict + DB reload) ────────────────────────────────────
 * POST /api/cache/redis/reloadAll            전체 도메인 재조회
 * POST /api/cache/redis/reload/{domains}    특정 도메인 재조회 (^ 멀티 지원)
 *
 * ── evict only (삭제, lazy 재적재) ────────────────────────────────
 * DELETE /api/cache/redis/{domains}         특정 도메인 캐시 삭제 (^ 멀티 지원)
 *
 * ── 지원 도메인 ───────────────────────────────────────────────────
 * reload 지원 : sy-code, sy-menu, sy-role, sy-role-menu, sy-prop, sy-i18n, ec-pd-cate
 * evict-only  : ec-pd-prod, ec-pd-cate-prod, ec-pm-prom, ec-pm-prom-item,
 *               ec-dp-disp, ec-dp-disp-item
 *
 * ── 공통 ──────────────────────────────────────────────────────────
 * Redis 비활성(app.redis.enabled=false) 시 모든 엔드포인트는 메시지만 반환
 * 멀티 도메인: ^ 구분자 사용  예) sy-code^sy-menu^sy-role
 */
@RestController
@RequestMapping("/api/cache/redis")
@RequiredArgsConstructor
public class CacheRedisReloadController {

    private static final String MSG_DISABLED = "Redis가 비활성화 상태입니다. (app.redis.enabled=false)";

    private final CacheRedisReloadService cacheRedisReloadService;

    /** 전체 도메인 재조회 */
    @PostMapping("/reloadAll")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> reloadAll() {
        if (!cacheRedisReloadService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Map<String, Integer> result = cacheRedisReloadService.reloadAll();
        return ResponseEntity.ok(ApiResponse.ok(result, "전체 캐시 재조회 완료"));
    }

    /**
     * 특정 도메인 재조회.
     * ^ 구분자로 멀티 지정 가능.
     * 예) POST /api/cache/redis/reload/sy-code^sy-menu
     */
    @PostMapping("/reload/{domains}")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> reload(@PathVariable("domains") String domains) {
        if (!cacheRedisReloadService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Map<String, Integer> result = cacheRedisReloadService.reloadMulti(domains);
        return ResponseEntity.ok(ApiResponse.ok(result, "캐시 재조회 완료"));
    }

    /**
     * 특정 도메인 evict (삭제만, lazy 재적재).
     * ^ 구분자로 멀티 지정 가능.
     * 예) DELETE /api/cache/redis/ec-pd-prod^ec-pm-prom
     */
    @DeleteMapping("/{domains}")
    public ResponseEntity<ApiResponse<Void>> evict(@PathVariable("domains") String domains) {
        if (!cacheRedisReloadService.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        cacheRedisReloadService.evictMulti(domains);
        int count = domains.split("\\^").length;
        return ResponseEntity.ok(ApiResponse.ok(null, count + "개 도메인 캐시 삭제 완료"));
    }
}
