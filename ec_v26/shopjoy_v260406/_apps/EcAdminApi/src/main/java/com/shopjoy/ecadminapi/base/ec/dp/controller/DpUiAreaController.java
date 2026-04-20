package com.shopjoy.ecadminapi.base.ec.dp.controller;

import com.shopjoy.ecadminapi.base.ec.dp.data.dto.DpUiAreaDto;
import com.shopjoy.ecadminapi.base.ec.dp.data.entity.DpUiArea;
import com.shopjoy.ecadminapi.base.ec.dp.service.DpUiAreaService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/dp/ui-area")
@RequiredArgsConstructor
public class DpUiAreaController {

    private final DpUiAreaService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<DpUiAreaDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<DpUiAreaDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<DpUiAreaDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<DpUiAreaDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiAreaDto>> getById(@PathVariable String id) {
        DpUiAreaDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 등록 (JPA) ── */
    @PostMapping
    public ResponseEntity<ApiResponse<DpUiArea>> create(@RequestBody DpUiArea entity) {
        DpUiArea result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    /* ── 전체 수정 (JPA) ── */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DpUiArea>> save(
            @PathVariable String id, @RequestBody DpUiArea entity) {
        entity.setUiAreaId(id);
        DpUiArea result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    /* ── 선택 필드 수정 (MyBatis) ── */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody DpUiArea entity) {
        entity.setUiAreaId(id);
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
