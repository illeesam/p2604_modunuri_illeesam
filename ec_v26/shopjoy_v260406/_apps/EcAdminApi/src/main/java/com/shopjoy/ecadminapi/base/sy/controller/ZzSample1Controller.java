package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.sy.service.ZzSample1Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/zz-sample1")
@RequiredArgsConstructor
public class ZzSample1Controller {

    private final ZzSample1Service service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample1Dto>>> list(
            @RequestParam Map<String, Object> p) {
        List<ZzSample1Dto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<ZzSample1Dto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<ZzSample1Dto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample1Dto>> getById(@PathVariable String id) {
        ZzSample1Dto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample1>> create(@RequestBody ZzSample1 entity) {
        ZzSample1 result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample1>> save(
            @PathVariable String id, @RequestBody ZzSample1 entity) {
        entity.setSample1Id(id);
        ZzSample1 result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody ZzSample1 entity) {
        entity.setSample1Id(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
