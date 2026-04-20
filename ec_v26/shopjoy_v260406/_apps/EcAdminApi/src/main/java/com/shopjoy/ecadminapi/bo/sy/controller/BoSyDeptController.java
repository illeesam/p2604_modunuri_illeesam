package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.auth.annotation.UserOnly;
import com.shopjoy.ecadminapi.base.sy.data.dto.SyDeptDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyDept;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyDeptService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * BO 부서 API — /api/bo/sy/dept
 * 인가: USER_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/dept")
@RequiredArgsConstructor
@UserOnly
public class BoSyDeptController {
    private final BoSyDeptService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyDeptDto>>> list(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(siteId, kw)));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyDeptDto>>> page(
            @RequestParam(required = false) String siteId,
            @RequestParam(required = false) String kw,
            @RequestParam(defaultValue = "1")  int pageNo,
            @RequestParam(defaultValue = "20") int pageSize) {
        return ResponseEntity.ok(ApiResponse.ok(service.page(siteId, kw, pageNo, pageSize)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto>> getById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.ok(service.getById(id)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyDept>> create(@RequestBody SyDept body) {
        return ResponseEntity.status(201).body(ApiResponse.created(service.create(body)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyDeptDto>> update(@PathVariable String id, @RequestBody SyDept body) {
        return ResponseEntity.ok(ApiResponse.ok(service.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
