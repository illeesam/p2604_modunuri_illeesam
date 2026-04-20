package com.shopjoy.ecadminapi.base.ec.pm.controller;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmSaveDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmSave;
import com.shopjoy.ecadminapi.base.ec.pm.service.PmSaveService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pm/save")
@RequiredArgsConstructor
public class PmSaveController {

    private final PmSaveService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PmSaveDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PmSaveDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PmSaveDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PmSaveDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSaveDto>> getById(@PathVariable String id) {
        PmSaveDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<PmSave>> create(@RequestBody PmSave entity) {
        PmSave result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<PmSave>> save(
            @PathVariable String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        PmSave result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody PmSave entity) {
        entity.setSaveId(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 삭제 (JPA) ── */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
