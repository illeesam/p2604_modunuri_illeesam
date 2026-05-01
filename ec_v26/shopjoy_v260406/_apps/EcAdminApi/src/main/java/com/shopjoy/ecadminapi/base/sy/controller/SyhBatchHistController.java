package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchHistDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhBatchHistService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/batch-hist")
@RequiredArgsConstructor
public class SyhBatchHistController {

    private final SyhBatchHistService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhBatchHistDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhBatchHistDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhBatchHistDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhBatchHistDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhBatchHistDto>> getById(@PathVariable String id) {
        SyhBatchHistDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
