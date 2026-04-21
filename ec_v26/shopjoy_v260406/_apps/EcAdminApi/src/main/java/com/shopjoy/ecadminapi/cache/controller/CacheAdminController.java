package com.shopjoy.ecadminapi.cache.controller;

import com.shopjoy.ecadminapi.cache.service.CacheAdminService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 캐시 관리 API.
 *
 * ── 상태/정보 ──────────────────────────────────────────────────────
 * GET  /api/cache/status        캐시 활성 여부 + 도메인별 지원 방식
 * GET  /api/cache/info          도메인별 캐시 상태 (키 존재 여부, 갱신 시각, 남은 TTL)
 *
 * ── 재조회 (evict + DB reload) ────────────────────────────────────
 * POST /api/cache/reload                전체 도메인 재조회
 * POST /api/cache/reload/{domains}      특정 도메인 재조회 (^ 멀티 지원)
 *
 * ── 캐시값 조회 ───────────────────────────────────────────────────
 * GET /api/cache/data/{domains}         도메인 전체 캐시값 (^ 멀티 지원)
 * GET /api/cache/data/{domain}/{key}    서브키 단건 캐시값
 *   예) /data/sy-code/ORDER_STATUS    → 주문상태 코드 그룹
 *       /data/sy-role-menu/ROLE001    → 역할별 메뉴 ID 목록
 *       /data/ec-pd-prod/P2604001     → 상품 상세
 *       /data/sy-i18n/ko:btn.save     → 다국어 메시지 단건
 *
 * ── evict only (삭제, lazy 재적재) ────────────────────────────────
 * DELETE /api/cache/{domains}           특정 도메인 캐시 삭제 (^ 멀티 지원)
 *
 * ── 지원 도메인 ───────────────────────────────────────────────────
 * reload 지원 : sy-code, sy-menu, sy-role, sy-role-menu, sy-prop, sy-i18n, ec-pd-cate
 * evict-only  : ec-pd-prod, ec-pd-cate-prod, ec-pm-prom, ec-pm-prom-item,
 *               ec-dp-disp, ec-dp-disp-item
 */
@RestController
@RequestMapping("/api/cache")
@RequiredArgsConstructor
public class CacheAdminController {

    private static final String MSG_DISABLED = "Redis가 비활성화 상태입니다. (app.redis.enabled=false)";

    private final CacheAdminService service;

    /** 캐시 활성 여부 + 도메인별 지원 방식 */
    @GetMapping("/status")
    public ResponseEntity<ApiResponse<Map<String, Object>>> status() {
        Map<String, Object> result = service.getStatus();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 도메인별 캐시 상태 (키 존재, 갱신 시각, 남은 TTL, 키 수) */
    @GetMapping("/info")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> info() {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        List<Map<String, Object>> result = service.getInfo();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /**
     * 도메인 전체 캐시값 조회.
     * ^ 구분자로 멀티 지정 시 Map<domain, value> 형태로 반환.
     * 예) /data/sy-code^sy-prop
     */
    @GetMapping("/data/{domains}")
    public ResponseEntity<ApiResponse<Object>> getCacheAll(@PathVariable String domains) {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));

        String[] parts = domains.split("\\^");
        if (parts.length == 1) {
            Object result = service.getCacheAll(domains.trim());
            if (result == null)
                return ResponseEntity.ok(ApiResponse.ok(null,
                    domains + ": 캐시 없음 또는 서브키가 필요한 도메인입니다."));
            return ResponseEntity.ok(ApiResponse.ok(result));
        }
        Map<String, Object> result = new LinkedHashMap<>();
        for (String d : parts) {
            result.put(d.trim(), service.getCacheAll(d.trim()));
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
            @PathVariable String domain,
            @PathVariable String key) {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Object result = service.getCacheByKey(domain, key);
        if (result == null)
            return ResponseEntity.ok(ApiResponse.ok(null, domain + "/" + key + ": 캐시 없음"));
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** 전체 도메인 재조회 */
    @PostMapping("/reload")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> reloadAll() {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Map<String, Integer> result = service.reloadAll();
        return ResponseEntity.ok(ApiResponse.ok(result, "전체 캐시 재조회 완료"));
    }

    /**
     * 특정 도메인 재조회.
     * ^ 구분자로 멀티 지정 가능.
     * 예) POST /api/cache/reload/sy-code^sy-menu
     */
    @PostMapping("/reload/{domains}")
    public ResponseEntity<ApiResponse<Map<String, Integer>>> reload(@PathVariable String domains) {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        Map<String, Integer> result = service.reloadMulti(domains);
        return ResponseEntity.ok(ApiResponse.ok(result, "캐시 재조회 완료"));
    }

    /**
     * 특정 도메인 evict (삭제만, lazy 재적재).
     * ^ 구분자로 멀티 지정 가능.
     * 예) DELETE /api/cache/ec-pd-prod^ec-pm-prom
     */
    @DeleteMapping("/{domains}")
    public ResponseEntity<ApiResponse<Void>> evict(@PathVariable String domains) {
        if (!service.isEnabled())
            return ResponseEntity.ok(ApiResponse.ok(null, MSG_DISABLED));
        service.evictMulti(domains);
        int count = domains.split("\\^").length;
        return ResponseEntity.ok(ApiResponse.ok(null, count + "개 도메인 캐시 삭제 완료"));
    }
}
