package com.shopjoy.ecadminapi.bo.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmCacheDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmCache;
import com.shopjoy.ecadminapi.bo.ec.pm.service.BoPmCacheService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
/**
 * BO 캐시(충전금) API — /api/bo/ec/pm/cache
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/ec/pm/cache")
@RequiredArgsConstructor
public class BoPmCacheController {
    private final BoPmCacheService boPmCacheService;

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<PmCacheDto.Item>>> list(@Valid @ModelAttribute PmCacheDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCacheService.getList(req)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PmCacheDto.PageResponse>> page(@Valid @ModelAttribute PmCacheDto.Request req) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCacheService.getPageData(req)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCacheDto.Item>> getById(@PathVariable("id") String id) {
        PmCacheDto.Item result = boPmCacheService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<PmCache>> create(@RequestBody PmCache body) {
        PmCache result = boPmCacheService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /** update — 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCache>> update(@PathVariable("id") String id, @RequestBody PmCache body) {
        PmCache result = boPmCacheService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /** upsert */
    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<PmCache>> upsert(@PathVariable("id") String id, @RequestBody PmCache body) {
        return ResponseEntity.ok(ApiResponse.ok(boPmCacheService.update(id, body)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boPmCacheService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<PmCache> rows) {
        boPmCacheService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}