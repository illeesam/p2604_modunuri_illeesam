package com.shopjoy.ecadminapi.base.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyhBatchLogDto;
import com.shopjoy.ecadminapi.base.sy.service.SyhBatchLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/sy/batch-log")
@RequiredArgsConstructor
public class SyhBatchLogController {

    private final SyhBatchLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyhBatchLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<SyhBatchLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyhBatchLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<SyhBatchLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyhBatchLogDto>> getById(@PathVariable("id") String id) {
        SyhBatchLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
