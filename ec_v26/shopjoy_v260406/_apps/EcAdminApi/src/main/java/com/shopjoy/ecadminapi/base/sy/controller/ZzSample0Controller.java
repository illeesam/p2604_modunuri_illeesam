package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample0Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import com.shopjoy.ecadminapi.base.sy.service.ZzSample0Service;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/zz-sample0")
@RequiredArgsConstructor
public class ZzSample0Controller {

    private final ZzSample0Service service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ZzSample0Dto>>> list(
            @RequestParam Map<String, Object> p) {
        List<ZzSample0Dto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<ZzSample0Dto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<ZzSample0Dto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample0Dto>> getById(@PathVariable String id) {
        ZzSample0Dto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ZzSample0>> create(@RequestBody ZzSample0 entity) {
        ZzSample0 result = service.create(entity);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ZzSample0>> save(
            @PathVariable String id, @RequestBody ZzSample0 entity) {
        entity.setSample0Id(id);
        ZzSample0 result = service.save(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ApiResponse<Integer>> update(
            @PathVariable String id, @RequestBody ZzSample0 entity) {
        entity.setSample0Id(id);
        int result = service.update(entity);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable String id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }
}
