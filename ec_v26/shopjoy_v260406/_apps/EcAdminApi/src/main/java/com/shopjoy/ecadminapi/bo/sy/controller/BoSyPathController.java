package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyPathDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyPath;
import com.shopjoy.ecadminapi.base.sy.service.SyPathService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 표시경로 API — /api/bo/sy/path
 */
@RestController
@RequestMapping("/api/bo/sy/path")
@RequiredArgsConstructor
public class BoSyPathController {

    private final SyPathService syPathService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getList(p)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyPathDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getPageData(p)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyPath>> create(@RequestBody SyPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(syPathService.create(entity)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> save(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.save(id, entity)));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.update(id, entity)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        syPathService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyPath> rows) {
        syPathService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
