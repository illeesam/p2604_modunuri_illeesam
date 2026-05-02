package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyDeptService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 부서 API — /api/bo/sy/dept
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/dept")
@RequiredArgsConstructor
public class BoSyDeptController {
    private final BoSyDeptService service;

    @GetMapping("/tree")
    public ResponseEntity<ApiResponse<List<SyDeptDto>>> tree() {
        return ResponseEntity.ok(ApiResponse.ok(service.getTree()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyDeptDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<SyDeptDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyDeptDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<SyDeptDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto>> getById(@PathVariable String id) {
        SyDeptDto result = service.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyDept>> create(@RequestBody SyDept body) {
        SyDept result = service.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto>> update(@PathVariable String id, @RequestBody SyDept body) {
        SyDeptDto result = service.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto>> upsert(@PathVariable String id, @RequestBody SyDept body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyDept> rows) {
        service.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
