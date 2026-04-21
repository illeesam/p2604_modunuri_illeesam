package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveItemDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSaveItem;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveItemService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pm/save-item")
@RequiredArgsConstructor
public class PmSaveItemController {

    private final PmSaveItemService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveItemDto>>> list(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmSaveItemDto>>> page(
            @RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(service.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveItemDto>> getById(@PathVariable String id) {
        PmSaveItemDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSaveItem>> create(@RequestBody PmSaveItem entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(entity)));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveItem>> save(
            @PathVariable String id, @RequestBody PmSaveItem entity) {
        entity.setSaveItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.save(entity)));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody PmSaveItem entity) {
        entity.setSaveItemId(id);
        return ResponseEntity.ok(ApiResponse.ok(service.update(entity)));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
