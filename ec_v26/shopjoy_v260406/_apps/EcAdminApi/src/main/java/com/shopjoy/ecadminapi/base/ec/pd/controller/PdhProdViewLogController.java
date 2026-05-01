package com.shopjoy.ecadminapi.base.ec.pd.controller;

import com.shopjoy.ecadminapi.base.ec.pd.data.dto.PdhProdViewLogDto;
import com.shopjoy.ecadminapi.base.ec.pd.service.PdhProdViewLogService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/base/ec/pd/prod-view-log")
@RequiredArgsConstructor
public class PdhProdViewLogController {

    private final PdhProdViewLogService service;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PdhProdViewLogDto>>> list(
            @RequestParam Map<String, Object> p) {
        List<PdhProdViewLogDto> result = service.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<PdhProdViewLogDto>>> page(
            @RequestParam Map<String, Object> p) {
        PageResult<PdhProdViewLogDto> result = service.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<PdhProdViewLogDto>> getById(@PathVariable String id) {
        PdhProdViewLogDto result = service.getById(id);
        if (result == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
