package com.shopjoy.ecadminapi.bo.sy.controller;

import com.shopjoy.ecadminapi.base.sy.data.dto.SyVendorDto;
import com.shopjoy.ecadminapi.base.sy.data.entity.SyVendor;
import com.shopjoy.ecadminapi.bo.sy.service.BoSyVendorService;
import com.shopjoy.ecadminapi.common.response.ApiResponse;
import com.shopjoy.ecadminapi.common.response.PageResult;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * BO 업체 API — /api/bo/sy/vendor
 * 인가: BO_ONLY (관리자)
 */
@RestController
@RequestMapping("/api/bo/sy/vendor")
@RequiredArgsConstructor
public class BoSyVendorController {
    private final BoSyVendorService boSyVendorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<SyVendorDto>>> list(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        List<SyVendorDto> result = boSyVendorService.getList(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/page")
    public ResponseEntity<ApiResponse<PageResult<SyVendorDto>>> page(
            @RequestParam Map<String, Object> p) {
        // CmUtil.require(p, "siteId");
        PageResult<SyVendorDto> result = boSyVendorService.getPageData(p);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorDto>> getById(@PathVariable("id") String id) {
        SyVendorDto result = boSyVendorService.getById(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<SyVendor>> create(@RequestBody SyVendor body) {
        SyVendor result = boSyVendorService.create(body);
        return ResponseEntity.status(201).body(ApiResponse.created(result));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorDto>> update(@PathVariable("id") String id, @RequestBody SyVendor body) {
        SyVendorDto result = boSyVendorService.update(id, body);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @PostMapping("/{id}")
    public ResponseEntity<ApiResponse<SyVendorDto>> upsert(@PathVariable("id") String id, @RequestBody SyVendor body) {
        return ResponseEntity.ok(ApiResponse.ok(boSyVendorService.update(id, body)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable("id") String id) {
        boSyVendorService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "삭제되었습니다."));
    }

    @PostMapping("/save-list")
    public ResponseEntity<ApiResponse<Void>> saveList(@RequestBody List<SyVendor> rows) {
        boSyVendorService.saveList(rows);
        return ResponseEntity.ok(ApiResponse.ok(null, "저장되었습니다."));
    }
}
