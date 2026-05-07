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

    /** list — 목록 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SyPathDto>>> list(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getList(p)));
    }

    /** page — 페이지 */
    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyPathDto>>> page(@RequestParam Map<String, Object> p) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getPageData(p)));
    }

    /** getById — 조회 */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPathDto>> getById(@PathVariable("id") String id) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.getById(id)));
    }

    /** create — 생성 */
    @PostMapping
    public ResponseEntity<ApiResponse<SyPath>> create(@RequestBody SyPath entity) {
        return ResponseEntity.status(201).body(ApiResponse.created(syPathService.create(entity)));
    }

    /** save — 저장 */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyPath>> save(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.save(id, entity)));
    }

    /** update — 수정 */
    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(@PathVariable("id") String id, @RequestBody SyPath entity) {
        return ResponseEntity.ok(ApiResponse.ok(syPathService.update(id, entity)));
    }

    /** delete — 삭제 */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        syPathService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    /** saveList — 저장 */
    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyPath> rows) {
        syPathService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
